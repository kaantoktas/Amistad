// script.js

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("nav .nav-link");
  const sections = document.querySelectorAll(".content-section");
  const header = document.querySelector("header");
  const body = document.body; // body elementini yakala

  let isScrollingFromNav = false; // Navigasyondan kaydırma yapılıp yapılmadığını takip eden flag

  // Smooth scroll for navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault(); // Varsayılan link davranışını engelle

      isScrollingFromNav = true; // Navigasyondan kaydırma başladığını işaretle
      body.style.scrollSnapType = "none"; // Geçici olarak scroll-snap'i devre dışı bırak

      const targetId = e.target.getAttribute("href"); // Linkin hedef ID'sini al (örn: "#gallery")
      const targetSection = document.querySelector(targetId); // Hedef bölümü seç

      if (targetSection) {
        const headerHeight = header.offsetHeight;
        window.scrollTo({
          top: targetSection.offsetTop - headerHeight,
          behavior: "smooth", // Yumuşak kaydırma efekti
        });

        // Kaydırma bittikten sonra scroll-snap'i tekrar etkinleştir
        // Genellikle kaydırma süresi 500-800ms civarında olur, biraz pay bırakalım
        setTimeout(() => {
          body.style.scrollSnapType = "y mandatory"; // Scroll-snap'i geri getir
          isScrollingFromNav = false; // Kaydırma bittiğini işaretle

          // Eğer galeri bölümüne gidildiyse fotoğrafları yükle
          if (targetId === '#gallery') {
            fetchAndDisplayPhotos();
          }
        }, 800); // Bu süreyi kaydırma hızınıza göre ayarlayabilirsiniz
      }

      // Tüm linklerden 'active' sınıfını kaldır
      navLinks.forEach((l) => l.classList.remove("active"));
      // Tıklanan linke 'active' sınıfını ekle
      e.target.classList.add("active");
    });
  });

  // Intersection Observer for highlighting active link on scroll
  // Header'ın yüksekliğini dikkate alarak görünürlük kontrolü yapar
  const observerOptions = {
    root: null, // viewport'u kök olarak kullan
    rootMargin: `-${header.offsetHeight}px 0px -50% 0px`, // Header'ın kapladığı alanı düş
    threshold: 0, // Eşiği 0 yapın, yani elementin bir kısmı görünür olduğunda tetiklensin
  };

  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !isScrollingFromNav) {
        // Eğer navigasyondan kaydırma yapılmıyorsa
        const currentSectionId = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${currentSectionId}`) {
            link.classList.add("active");
          }
        });

        // Eğer galeri bölümü görünür hale gelirse fotoğrafları yükle
        if (currentSectionId === 'gallery') {
          fetchAndDisplayPhotos();
        }
      }
    });
  }, observerOptions);

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });

  // Sayfa yüklendiğinde ve URL'de hash varsa doğru aktif linki belirle
  const initialActiveLink = () => {
    const hash = window.location.hash;
    if (hash) {
      // Eğer hash varsa ve navigasyondan geliyorsak zaten ele alınmıştır, burada sadece vurgula
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === hash) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
      // Sayfa başlangıçta hash ile açılırsa da kaydırma efekti ver
      const targetSection = document.querySelector(hash);
      if (targetSection) {
        const headerHeight = header.offsetHeight;
        window.scrollTo({
          top: targetSection.offsetTop - headerHeight,
          behavior: "smooth",
        });
      }
      // Eğer başlangıçta galeri hash'i ile açıldıysa fotoğrafları yükle
      if (hash === '#gallery') {
        fetchAndDisplayPhotos();
      }
    } else {
      // Eğer hash yoksa Ana Sayfa'yı aktif yap ve en üste kaydır
      document
        .querySelector('nav .nav-link[href="#home"]')
        .classList.add("active");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // İlk yüklemede ve sayfa yüklendiğinde çalıştır
  initialActiveLink();
  window.addEventListener("load", initialActiveLink);

  // Scroll anında aktif linki kontrol et (daha dinamik bir deneyim için)
  window.addEventListener("scroll", () => {
    if (isScrollingFromNav) return; // Navigasyondan kaydırma yapılıyorsa bu kısmı atla

    let current = "";
    const headerHeight = header.offsetHeight;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - headerHeight;
      const sectionHeight = section.clientHeight;
      if (
        pageYOffset >= sectionTop &&
        pageYOffset < sectionTop + sectionHeight
      ) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });

  // ******************************************************
  // GALERİ YÜKLEME VE GÖRÜNTÜLEME İŞLEVSELLİĞİ BURAYA EKLENDİ
  // ******************************************************

  const uploadForm = document.getElementById("uploadForm");
  const photoInput = document.getElementById("photoInput");
  const uploadMessage = document.getElementById("uploadMessage");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const galleryGrid = document.getElementById("galleryGrid");
  const uploadButton = document.getElementById("uploadButton");

  // Fotoğraf yükleme formunu dinle
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Varsayılan form gönderme davranışını engelle

      // Dosya seçili mi kontrol et
      if (!photoInput.files || photoInput.files.length === 0) {
        uploadMessage.textContent = "Lütfen yüklemek için bir fotoğraf seçin.";
        uploadMessage.style.color = "red";
        return;
      }

      const file = photoInput.files[0];

      // Dosyayı Base64'e dönüştür
      const reader = new FileReader();
      reader.readAsDataURL(file); // Dosyayı Base64 string olarak oku

      reader.onloadstart = () => {
        uploadMessage.textContent = '';
        loadingIndicator.style.display = 'block';
        uploadButton.disabled = true;
        photoInput.disabled = true;
      };

      reader.onload = async () => {
        const photoData = reader.result; // Base64 kodlu veri
        const fileName = file.name; // Dosya adı

        try {
          // Netlify Fonksiyonuna POST isteği gönder
          // netlify.toml'daki redirect sayesinde /api/upload -> /.netlify/functions/upload olacak
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json' // Base64 verisi JSON olarak gönderiliyor
            },
            body: JSON.stringify({ photoData, fileName }), // Base64 verisini ve dosya adını JSON olarak gönder
          });

          const data = await response.json();

          if (response.ok && data.success) {
            uploadMessage.textContent = data.message;
            uploadMessage.style.color = "green";
            // Yükleme başarılı olduktan sonra galeriyi yeniden yükle
            fetchAndDisplayPhotos();
            // Formu sıfırla
            uploadForm.reset();
          } else {
            uploadMessage.textContent = `Hata: ${
              data.message || "Bilinmeyen bir hata oluştu."
            }`;
            uploadMessage.style.color = "red";
          }
        } catch (error) {
          console.error("Yükleme sırasında hata oluştu:", error);
          uploadMessage.textContent = "Yükleme sırasında bir ağ hatası oluştu.";
          uploadMessage.style.color = "red";
        } finally {
          // Yükleme bittiğinde durumu sıfırla
          loadingIndicator.style.display = "none";
          uploadButton.disabled = false;
          photoInput.disabled = false;
        }
      };

      reader.onerror = (error) => {
        console.error("Dosya okuma hatası:", error);
        uploadMessage.textContent = "Dosya okunurken bir hata oluştu.";
        uploadMessage.style.color = "red";
        loadingIndicator.style.display = "none";
        uploadButton.disabled = false;
        photoInput.disabled = false;
      };
    });
  }

  // Cloudinary'den fotoğrafları çekip galeride gösterme fonksiyonu
  async function fetchAndDisplayPhotos() {
    const gallerySection = document.getElementById('gallery');
    if (!gallerySection) return;

    galleryGrid.innerHTML = ""; // Mevcut görselleri temizle
    loadingIndicator.style.display = "block"; // Yükleniyor göstergesini aç

    try {
      // Netlify Fonksiyonundan fotoğrafları çekme
      // netlify.toml'daki redirect sayesinde /api/get-photos -> /.netlify/functions/get-photos olacak
      const response = await fetch("/api/get-photos");
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.photos.length === 0) {
          galleryGrid.innerHTML = "<p>Henüz hiç fotoğraf yüklenmedi.</p>";
        } else {
          data.photos.forEach((photo) => {
            const galleryItem = document.createElement("div");
            galleryItem.classList.add("gallery-item");

            // İndirme linkini oluştur
            const downloadLink = document.createElement('a');
            downloadLink.href = photo.imageUrl;
            downloadLink.download = photo.fileName; // İndirilecek dosya adı
            downloadLink.classList.add('download-btn');
            downloadLink.textContent = 'İndir';

            // Programlı indirme için olay dinleyici
            downloadLink.addEventListener('click', async (e) => {
                e.preventDefault(); // Varsayılan link davranışını engelle

                try {
                    const imageResponse = await fetch(photo.imageUrl);
                    const imageBlob = await imageResponse.blob();
                    const objectUrl = URL.createObjectURL(imageBlob);

                    const tempLink = document.createElement('a');
                    tempLink.href = objectUrl;
                    tempLink.download = photo.fileName; // İndirilecek dosya adı
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    document.body.removeChild(tempLink);
                    URL.revokeObjectURL(objectUrl); // Belleği serbest bırak

                } catch (error) {
                    console.error('Fotoğraf indirilirken hata oluştu:', error);
                    alert('Fotoğraf indirilemedi. Lütfen tekrar deneyin.'); // Kullanıcıya hata bildirimi
                }
            });

            galleryItem.innerHTML = `
                <img src="${photo.imageUrl}" alt="${photo.fileName}" />
                <div class="gallery-item-info">
                    <h3>${photo.fileName}</h3>
                    <p>Yüklenme Tarihi: ${new Date(photo.createdAt).toLocaleDateString()}</p>
                </div>
            `;
            // İndirme linkini info div'ine ekle
            galleryItem.querySelector('.gallery-item-info').appendChild(downloadLink);
            galleryGrid.appendChild(galleryItem);
          });
        }
      } else {
        galleryGrid.innerHTML = `<p style="color: red;">Fotoğraflar yüklenirken hata oluştu: ${
          data.message || "Bilinmeyen hata"
        }</p>`;
      }
    } catch (error) {
      console.error("Fotoğraf çekme sırasında hata oluştu:", error);
      galleryGrid.innerHTML = `<p style="color: red;">Fotoğraflar yüklenirken bir ağ hatası oluştu.</p>`;
    } finally {
      loadingIndicator.style.display = "none"; // Yükleniyor göstergesini kapat
    }
  }

  // Sayfa yüklendiğinde ve eğer galeri bölümü başlangıçta görünürse veya hash ile gelindiyse fotoğrafları çek ve göster
  // Bu çağrı, initialActiveLink veya IntersectionObserver tarafından da tetiklenebilir.
  // Bu yüzden burada doğrudan çağrıyı kaldırdık ve sadece ilgili olaylarda tetiklenmesini sağladık.
});
