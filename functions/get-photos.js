// functions/get-photos.js
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
  // Sadece GET isteklerini kabul et
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    // 'medya_galerisi_yuklemeler' klasöründeki tüm resimleri listele
    // max_results değeri 50'den 500'e çıkarıldı (Cloudinary'nin tek seferde getirebileceği maksimum)
    const result = await cloudinary.search
      .expression("folder:medya_galerisi_yuklemeler")
      .sort_by("public_id", "desc") // En yeni yüklenenleri üste getir
      .max_results(500) // Maksimum 500 sonuç getir
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
