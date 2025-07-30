// functions/upload.js
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

// Ortam değişkenlerini yükle (Netlify'de otomatik olarak sağlanır, ancak yerel test için gerekli olabilir)
dotenv.config();

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Netlify Function handler'ı
exports.handler = async (event, context) => {
  // Sadece POST isteklerini kabul et
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    // Frontend'den gelen Base64 kodlu fotoğraf verisini al
    // event.body, string olarak gelir, JSON.parse ile objeye dönüştürülür
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

    // Base64 verisinin başında 'data:image/jpeg;base64,' gibi bir prefix varsa kaldır
    const base64Image = photoData.split(";base64,").pop();

    // Cloudinary'ye Base64 verisini yükle
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Image}`,
      {
        folder: "medya_galerisi_yuklemeler", // Cloudinary'deki klasör adı
        resource_type: "image", // Resim olarak yükle
        public_id: fileName ? fileName.split(".")[0] : undefined, // Dosya adını public_id olarak kullan (isteğe bağlı)
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Fotoğraf başarıyla yüklendi!",
        imageUrl: result.secure_url,
        publicId: result.public_id,
        fileName: fileName, // Frontend'den gelen dosya adını geri gönder
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
