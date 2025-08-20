document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("nav .nav-link");
  const sections = document.querySelectorAll(".content-section");
  const header = document.querySelector("header");
  const body = document.body; 

  let isScrollingFromNav = false; 

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault(); 

      isScrollingFromNav = true; 
      body.style.scrollSnapType = "none"; 

      const targetId = e.target.getAttribute("href"); 
      const targetSection = document.querySelector(targetId); 

      if (targetSection) {
        const headerHeight = header.offsetHeight;
        window.scrollTo({
          top: targetSection.offsetTop - headerHeight,
          behavior: "smooth", 
        });
        setTimeout(() => {
          body.style.scrollSnapType = "y mandatory"; 
          isScrollingFromNav = false; 

        
          if (targetId === "#gallery") {
            fetchAndDisplayPhotos();
            uploadSection.style.display = 'block';
            showPhotosOnlyButton.style.display = 'inline-block';
            showUploadFormButton.style.display = 'none';
          }
        }, 800); 
      }
      navLinks.forEach((l) => l.classList.remove("active"));
      e.target.classList.add("active");
    });
  });

  const observerOptions = {
    root: null, 
    rootMargin: `-${header.offsetHeight}px 0px -50% 0px`, 
    threshold: 0, 
  };

  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !isScrollingFromNav) {
        const currentSectionId = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${currentSectionId}`) {
            link.classList.add("active");
          }
        });
        if (currentSectionId === "gallery") {
          fetchAndDisplayPhotos();
          uploadSection.style.display = 'block';
          showPhotosOnlyButton.style.display = 'inline-block';
          showUploadFormButton.style.display = 'none';
        }
      }
    });
  }, observerOptions);

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });

  const initialActiveLink = () => {
    const hash = window.location.hash;
    if (hash) {
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === hash) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
      const targetSection = document.querySelector(hash);
      if (targetSection) {
        const headerHeight = header.offsetHeight;
        window.scrollTo({
          top: targetSection.offsetTop - headerHeight,
          behavior: "smooth",
        });
      }
      if (hash === "#gallery") {
        fetchAndDisplayPhotos();
        uploadSection.style.display = 'block';
        showPhotosOnlyButton.style.display = 'inline-block';
        showUploadFormButton.style.display = 'none';
      }
    } else {
      document
        .querySelector('nav .nav-link[href="#home"]')
        .classList.add("active");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };
  initialActiveLink();
  window.addEventListener("load", initialActiveLink);

  window.addEventListener("scroll", () => {
    if (isScrollingFromNav) return; 

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
  const uploadForm = document.getElementById("uploadForm");
  const photoInput = document.getElementById("photoInput");
  const uploadMessage = document.getElementById("uploadMessage");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const galleryGrid = document.getElementById("galleryGrid");
  const uploadButton = document.getElementById("uploadButton");

  const uploadSection = document.getElementById("uploadSection");
  const showPhotosOnlyButton = document.getElementById("showPhotosOnlyButton");
  const showUploadFormButton = document.getElementById("showUploadFormButton");

  if (showPhotosOnlyButton) {
    showPhotosOnlyButton.addEventListener('click', () => {
      uploadSection.style.display = 'none'; 
      showPhotosOnlyButton.style.display = 'none'; 
      showUploadFormButton.style.display = 'inline-block'; 
      fetchAndDisplayPhotos();
    });
  }

  if (showUploadFormButton) {
    showUploadFormButton.addEventListener('click', () => {
      uploadSection.style.display = 'block'; 
      showPhotosOnlyButton.style.display = 'inline-block'; 
      showUploadFormButton.style.display = 'none'; 
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault(); 

      if (!photoInput.files || photoInput.files.length === 0) {
        uploadMessage.textContent = "Lütfen yüklemek için bir veya daha fazla fotoğraf seçin.";
        uploadMessage.style.color = "red";
        return;
      }

      const files = Array.from(photoInput.files); 
      let uploadedCount = 0;
      let failedCount = 0;

     
      uploadMessage.textContent = "";
      loadingIndicator.style.display = "block";
      uploadButton.disabled = true; 
      photoInput.disabled = true; 


      const uploadPromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file); 

          reader.onload = async () => {
            const photoData = reader.result;
            const fileName = file.name; 

            try {
              const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ photoData, fileName }),
              });

              const data = await response.json();

              if (response.ok && data.success) {
                uploadedCount++;
                console.log(`'${fileName}' başarıyla yüklendi.`);
              } else {
                failedCount++;
                console.error(`'${fileName}' yüklenirken hata: ${data.message || 'Bilinmeyen hata'}`);
              }
            } catch (error) {
              failedCount++;
              console.error(`'${fileName}' yüklenirken ağ hatası:`, error);
            } finally {
              resolve(); 
            }
          };

          reader.onerror = (error) => {
            failedCount++;
            console.error(`'${file.name}' okunurken hata:`, error);
            resolve(); 
          };
        });
      });

      await Promise.allSettled(uploadPromises);

      if (uploadedCount > 0 && failedCount === 0) {
        uploadMessage.textContent = `${uploadedCount} fotoğraf başarıyla yüklendi!`;
        uploadMessage.style.color = "green";
      } else if (uploadedCount > 0 && failedCount > 0) {
        uploadMessage.textContent = `${uploadedCount} fotoğraf yüklendi, ${failedCount} fotoğraf yüklenemedi. Detaylar için konsolu kontrol edin.`;
        uploadMessage.style.color = "orange";
      } else {
        uploadMessage.textContent = `Hiç fotoğraf yüklenemedi. Detaylar için konsolu kontrol edin.`;
        uploadMessage.style.color = "red";
      }

      fetchAndDisplayPhotos();
      uploadForm.reset();

      loadingIndicator.style.display = "none";
      uploadButton.disabled = false;
      photoInput.disabled = false;
    });
  }

  async function fetchAndDisplayPhotos() {
    const gallerySection = document.getElementById("gallery");
    if (!gallerySection) return;

    galleryGrid.innerHTML = ""; 
    loadingIndicator.style.display = "block"; 

    try {
     
      const response = await fetch("/api/get-photos");
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.photos.length === 0) {
          galleryGrid.innerHTML = "<p>Henüz hiç fotoğraf yüklenmedi.</p>";
        } else {
          data.photos.forEach((photo) => {
            const galleryItem = document.createElement("div");
            galleryItem.classList.add("gallery-item");

            const downloadLink = document.createElement('a');
            downloadLink.href = photo.imageUrl;
            downloadLink.download = photo.fileName; 
            downloadLink.classList.add('download-btn');
            downloadLink.textContent = 'İndir';

            downloadLink.addEventListener('click', async (e) => {
                e.preventDefault(); 

                try {
                    const imageResponse = await fetch(photo.imageUrl);
                    const imageBlob = await imageResponse.blob();
                    const objectUrl = URL.createObjectURL(imageBlob);

                    const tempLink = document.createElement('a');
                    tempLink.href = objectUrl;
                    tempLink.download = photo.fileName; 
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    document.body.removeChild(tempLink);
                    URL.revokeObjectURL(objectUrl);

                } catch (error) {
                    console.error('Fotoğraf indirilirken hata oluştu:', error);
                    alert('Fotoğraf indirilemedi. Lütfen tekrar deneyin.'); 
                }
            });

            galleryItem.innerHTML = `
                <img src="${photo.imageUrl}" alt="${photo.fileName}" />
                <div class="gallery-item-info">
                    <h3>${photo.fileName}</h3>
                    <p>Yüklenme Tarihi: ${new Date(photo.createdAt).toLocaleDateString()}</p>
                </div>
            `;
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
      loadingIndicator.style.display = "none";
    }
  }


});
