const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const admin = require('../firebase-admin');

// Import Mongoose Models
const Project = require('../models/Project');
const Setting = require('../models/Setting');
const PaymentRequest = require('../models/PaymentRequest');
const DownloadToken = require('../models/DownloadToken');

const REQUEST_EXPIRY_MS = 15 * 60 * 1000; // 15 mins
const DOWNLOAD_EXPIRY_MS = 5 * 60 * 1000; // 5 mins

module.exports = (io) => {
  // Get all published projects
  router.get('/projects', async (req, res) => {
    try {
      const projects = await Project.find({});
      res.json(projects);
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Get public settings
  router.get('/settings', async (req, res) => {
    try {
      let settings = await Setting.findOne({ globalId: 'global' });
      if (!settings) {
        settings = {
          upiId: 'seller@upi',
          sellerName: 'Developer',
          developerTitle: 'Full Stack Engineer'
        };
      }
      res.json(settings);
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Admin: Update settings
  router.post('/admin/settings', authMiddleware, async (req, res) => {
    const newSettings = req.body;
    if (!newSettings) return res.status(400).json({ error: 'No data provided' });
    
    try {
      const merged = await Setting.findOneAndUpdate(
        { globalId: 'global' },
        { $set: newSettings },
        { new: true, upsert: true }
      );
      res.json({ success: true, settings: merged });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Admin: Fetch public github repos
  router.get('/admin/github/repos', authMiddleware, async (req, res) => {
    try {
      const profileUrl = 'https://github.com/muthukumar9360';
      const username = profileUrl.split('/').pop();
      if (!username) {
        return res.status(400).json({ error: 'GitHub profile URL not set in Settings' });
      }
      
      const response = await fetch(`https://api.github.com/users/${username}/repos?type=public&sort=updated`);
      if (!response.ok) throw new Error('GitHub API failed');
      const repos = await response.json();
      
      res.json(repos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  });

  // Admin: Publish new project
  router.post('/admin/projects', authMiddleware, async (req, res) => {
    const projectData = req.body;
    if (!projectData || !projectData.id || !projectData.zipPath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
      const project = await Project.findOneAndUpdate(
        { id: projectData.id },
        { $set: projectData },
        { new: true, upsert: true }
      );
      res.json({ success: true, project });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save project' });
    }
  });

  // 1. Create a Payment Request (Called by customer)
  router.post('/payment/request', async (req, res) => {
    const { projectId, projectName, amount } = req.body;
    if (!projectId || !projectName || amount === undefined) {
      return res.status(400).json({ error: 'Missing projectId, projectName or amount' });
    }
    
    try {
      const request = new PaymentRequest({
        id: crypto.randomUUID(),
        projectId,
        projectName,
        amount,
        status: 'PENDING',
        sessionToken: crypto.randomUUID()
      });
      await request.save();
      
      // Notify admin via socket (we broadcast to a specific admin room)
      io.to('admin_room').emit('new_payment_request', request);
      
      // Fire Push Notification via FCM if configured
      if (admin.isConfigured()) {
        const settings = await Setting.findOne({ globalId: 'global' });
        if (settings && settings.adminFcmToken) {
          try {
            await admin.getMessaging().send({
              token: settings.adminFcmToken,
              data: {
                force_notification: 'true',
                title: 'New Payment Verification Request!',
                body: `Verify payment of ₹${amount} for ${projectName}`
              }
            });
            console.log('Push notification sent to admin device');
          } catch (err) {
            console.error('Failed to send FCM push notification', err);
          }
        }
      }

      res.status(201).json(request);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create payment request' });
    }
  });

  // 1.2 Save Admin FCM Token
  router.post('/admin/fcm-token', authMiddleware, async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'Token is required' });
      
      let settings = await Setting.findOne({ globalId: 'global' });
      if (!settings) {
        settings = new Setting({ globalId: 'global' });
      }
      settings.adminFcmToken = token;
      await settings.save();
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save FCM token' });
    }
  });

  // 1.5 Get a specific payment request for the waiting page
  router.get('/payment/request/:requestId', async (req, res) => {
    try {
      const request = await PaymentRequest.findOne({ id: req.params.requestId });
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      res.json({
        id: request.id,
        status: request.status,
        expiresAt: request.expiresAt
      });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // 2. Admin: Get all pending requests
  router.get('/admin/payment/requests', authMiddleware, async (req, res) => {
    try {
      const pending = await PaymentRequest.find({ status: 'PENDING' }).sort({ expiresAt: 1 });
      res.json(pending);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  // 3. Admin: Accept Payment
  router.post('/admin/payment/accept', authMiddleware, async (req, res) => {
    const { requestId } = req.body;
    
    try {
      const request = await PaymentRequest.findOne({ id: requestId });
      if (!request || request.status !== 'PENDING') {
        return res.status(400).json({ error: 'Invalid or already processed request' });
      }
      
      request.status = 'ACCEPTED';
      await request.save();
      
      const tokenData = new DownloadToken({
        token: crypto.randomBytes(32).toString('hex'),
        projectId: request.projectId,
        requestId: request.id,
        expiresAt: new Date(Date.now() + DOWNLOAD_EXPIRY_MS)
      });
      await tokenData.save();
      
      // Notify customer via socket
      io.to(`request_${requestId}`).emit('payment_status_update', {
        status: 'ACCEPTED',
        downloadToken: tokenData.token,
        expiresAt: tokenData.expiresAt
      });
      
      res.json({ success: true, tokenData });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // 4. Admin: Decline Payment
  router.post('/admin/payment/decline', authMiddleware, async (req, res) => {
    const { requestId } = req.body;
    
    try {
      const request = await PaymentRequest.findOne({ id: requestId });
      if (!request || request.status !== 'PENDING') {
        return res.status(400).json({ error: 'Invalid or already processed request' });
      }
      
      request.status = 'DECLINED';
      await request.save();
      
      // Notify customer
      io.to(`request_${requestId}`).emit('payment_status_update', {
        status: 'DECLINED'
      });
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // 5. Validate Download Token (For client UI restoration)
  router.get('/download/validate/:token', async (req, res) => {
    const { token } = req.params;
    
    try {
      const tokenData = await DownloadToken.findOne({ token });
      
      if (!tokenData) {
        return res.status(404).json({ error: 'Invalid token' });
      }
      
      if (tokenData.used) {
        return res.status(410).json({ error: 'This download link has already been used.', status: 'USED' });
      }
      
      if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
        await DownloadToken.updateOne({ token }, { $set: { used: true }, $unset: { expiresAt: 1 } });
        return res.status(410).json({ error: 'Token expired', status: 'EXPIRED' });
      }
      
      res.json({
        valid: true,
        expiresAt: tokenData.expiresAt,
        projectId: tokenData.projectId
      });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // 6. Execute Download (Streams the ZIP file)
  router.get('/download/:token', async (req, res) => {
    const { token } = req.params;
    
    try {
      const tokenData = await DownloadToken.findOne({ token });
      
      // 1. Validate token existence
      if (!tokenData) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      
      // 3. Validate usage and expiry
      if (tokenData.used) {
        return res.status(410).json({ error: 'This download link has already been used.' });
      }

      if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
        await DownloadToken.updateOne({ token }, { $set: { used: true }, $unset: { expiresAt: 1 } });
        return res.status(410).json({ error: 'Download access has expired.' });
      }
      
      const project = await Project.findOne({ id: tokenData.projectId });
      if (!project) {
        return res.status(500).json({ error: 'Project configuration missing' });
      }
      
      // 4. ATOMICALLY mark as used and unset expiresAt instead of deleting row
      await DownloadToken.updateOne({ token }, { $set: { used: true }, $unset: { expiresAt: 1 } });
      await PaymentRequest.updateOne({ id: tokenData.requestId }, { $set: { status: 'DOWNLOADED' }, $unset: { expiresAt: 1 } });
      
      // Also notify socket if needed, but not strictly required
      io.to(`request_${tokenData.requestId}`).emit('download_used', { token });
      
      // 5. Redirect to GitHub zipball URL
      // E.g., https://api.github.com/repos/muthukumar9360/RepoName/zipball
      const githubUrl = `https://api.github.com/repos/${project.github.owner}/${project.github.repository}/zipball`;
      res.redirect(githubUrl);
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
};
