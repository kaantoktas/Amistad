const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const result = await cloudinary.search
      .expression("folder:medya_galerisi_yuklemeler")
      .sort_by("public_id", "desc") 
      .max_results(500) 
      .execute();

    const photos = result.resources.map((resource) => ({
      imageUrl: resource.secure_url,
      publicId: resource.public_id,
      fileName: resource.filename || resource.public_id,
      createdAt: resource.created_at,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, photos }),
    };
  } catch (error) {
    console.error("Fotoğraflar getirilirken hata oluştu:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Fotoğraflar getirilirken sunucu hatası oluştu.",
        error: error.message,
      }),
    };
  }
};
