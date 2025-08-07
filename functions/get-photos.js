// functions/get-photos.js
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Ortam değişkenlerini yükle (Netlify'de otomatik olarak sağlanır, ancak yerel test için gerekli olabilir)
dotenv.config();

// Cloudinary yapılandırması
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Netlify Function handler'ı
exports.handler = async (event, context) => {
    // Sadece GET isteklerini kabul et
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        // Frontend'den gelen sorgu parametrelerini al
        const { next_cursor, limit } = event.queryStringParameters;

        // Varsayılan limit 30 olsun, maksimum 100 olarak ayarla (Cloudinary'nin tek seferde getirebileceği makul bir limit)
        const resultsLimit = parseInt(limit) || 30;
        const maxResults = Math.min(resultsLimit, 100); // Aşırı büyük istekleri önlemek için maksimum 100 ile sınırla

        let searchBuilder = cloudinary.search
            .expression('folder:medya_galerisi_yuklemeler')
            .sort_by('public_id', 'desc') // En yeni yüklenenleri üste getir
            .max_results(maxResults); // Belirtilen limit kadar sonuç getir

        // Eğer bir sonraki imleç (next_cursor) varsa, aramayı o noktadan devam ettir
        if (next_cursor) {
            searchBuilder = searchBuilder.next_cursor(next_cursor);
        }

        const result = await searchBuilder.execute();

        const photos = result.resources.map(resource => ({
            imageUrl: resource.secure_url,
            publicId: resource.public_id,
            fileName: resource.filename || resource.public_id,
            createdAt: resource.created_at
        }));

        // Frontend'e gönderilecek yanıt
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                photos: photos,
                next_cursor: result.next_cursor || null, // Bir sonraki sayfa için imleç
                total_count: result.total_count || photos.length // Toplam fotoğraf sayısı (Cloudinary'nin total_count'u bazen tüm klasör için olmayabilir, dikkat)
            }),
        };

    } catch (error) {
        console.error('Fotoğraflar getirilirken hata oluştu:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Fotoğraflar getirilirken sunucu hatası oluştu.', error: error.message }),
        };
    }
};
