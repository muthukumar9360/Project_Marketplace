export const siteConfig = {
  websiteName: import.meta.env.VITE_WEBSITE_NAME || "ProjectVault",
  tagline: import.meta.env.VITE_TAGLINE || "Buy. Build. Launch.",
  sellerName: import.meta.env.VITE_SELLER_NAME || "Developer",
  developerTitle: import.meta.env.VITE_DEVELOPER_TITLE || "Full Stack Engineer",
  upiId: import.meta.env.VITE_UPI_ID || "seller@upi",
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || "+1234567890",
  email: import.meta.env.VITE_EMAIL || "hello@example.com",
  githubProfile: import.meta.env.VITE_GITHUB_PROFILE || "https://github.com/developer",
  linkedinProfile: import.meta.env.VITE_LINKEDIN_PROFILE || "https://linkedin.com/in/developer",
  upiQrImage: import.meta.env.VITE_UPI_QR_IMAGE || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=seller@upi&pn=Seller",
  profilePhoto: import.meta.env.VITE_PROFILE_PHOTO || "https://avatars.githubusercontent.com/u/9919?v=4"
};
