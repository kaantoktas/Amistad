const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const { photoData, fileName } = JSON.parse(event.body);

    if (!photoData) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Fotoğraf verisi eksik.",
        }),
      };
    }

    const base64Image = photoData.split(";base64,").pop();

    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Image}`,
      {
        folder: "medya_galerisi_yuklemeler", 
        resource_type: "image", 
        public_id: fileName ? fileName.split(".")[0] : undefined, 
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Fotoğraf başarıyla yüklendi!",
        imageUrl: result.secure_url,
        publicId: result.public_id,
        fileName: fileName, 
      }),
    };
  } catch (error) {
    console.error("Fotoğraf yüklenirken hata oluştu:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Dosya yüklenirken sunucu hatası oluştu.",
        error: error.message,
      }),
    };
  }
};
