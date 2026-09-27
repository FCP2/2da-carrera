document.addEventListener(
  'DOMContentLoaded',
  () => {

    const filters =
      [...document.querySelectorAll(
        '.gallery-filter'
      )];

    const items =
      [...document.querySelectorAll(
        '.gallery-item'
      )];


    const visiblePhotoCount =
      document.getElementById(
        'visiblePhotoCount'
      );

    const emptyFilter =
      document.getElementById(
        'galleryEmptyFilter'
      );


    const lightbox =
      document.getElementById(
        'galleryLightbox'
      );

    const lightboxImage =
      document.getElementById(
        'lightboxImage'
      );

    const lightboxTitle =
      document.getElementById(
        'lightboxTitle'
      );

    const lightboxCounter =
      document.getElementById(
        'lightboxCounter'
      );


    const closeLightbox =
      document.getElementById(
        'closeLightbox'
      );

    const previousButton =
      document.getElementById(
        'previousPhoto'
      );

    const nextButton =
      document.getElementById(
        'nextPhoto'
      );


    let visibleItems = [...items];

    let currentIndex = 0;



    // =========================
    // FILTROS
    // =========================

    function setActiveFilter(activeButton) {

      filters.forEach(button => {

        button.classList.remove(
          'bg-guinda',
          'text-white',
          'shadow-sm'
        );

        button.classList.add(
          'border',
          'border-linea',
          'bg-white',
          'text-texto-soft'
        );

      });


      activeButton.classList.remove(
        'border',
        'border-linea',
        'bg-white',
        'text-texto-soft'
      );


      activeButton.classList.add(
        'bg-guinda',
        'text-white',
        'shadow-sm'
      );

    }



    function updateVisibleCounter() {

      const total =
        visibleItems.length;


      if (visiblePhotoCount) {

        visiblePhotoCount.innerHTML = `
          Mostrando
          <strong class="text-guinda-dark">
            ${total}
          </strong>
          ${total === 1
            ? 'fotografía'
            : 'fotografías'}
        `;

      }


      if (emptyFilter) {

        if (total === 0) {

          emptyFilter.classList.remove(
            'hidden'
          );

        } else {

          emptyFilter.classList.add(
            'hidden'
          );

        }

      }

    }



    filters.forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const filter =
            button.dataset.filter;


          setActiveFilter(button);


          items.forEach(item => {

            const category =
              item.dataset.category;


            const visible =
              filter === 'all' ||
              category === filter;


            item.classList.toggle(
              'hidden',
              !visible
            );

          });


          visibleItems =
            items.filter(
              item =>
                !item.classList.contains(
                  'hidden'
                )
            );


          updateVisibleCounter();

        }
      );

    });



    // =========================
    // LIGHTBOX
    // =========================

    function showPhoto(index) {

      if (!visibleItems.length) {
        return;
      }


      if (index < 0) {

        index =
          visibleItems.length - 1;

      }


      if (
        index >= visibleItems.length
      ) {

        index = 0;

      }


      currentIndex = index;


      const item =
        visibleItems[currentIndex];


      lightboxImage.src =
        item.dataset.image;

      lightboxImage.alt =
        item.dataset.title || '';

      lightboxTitle.textContent =
        item.dataset.title || '';


      if (lightboxCounter) {

        lightboxCounter.textContent =
          `${currentIndex + 1} de ${visibleItems.length}`;

      }

    }



    function openLightbox(item) {

      visibleItems =
        items.filter(
          current =>
            !current.classList.contains(
              'hidden'
            )
        );


      currentIndex =
        visibleItems.indexOf(item);


      if (currentIndex < 0) {
        currentIndex = 0;
      }


      showPhoto(currentIndex);


      lightbox.classList.remove(
        'hidden'
      );

      lightbox.classList.add(
        'flex'
      );


      document.body.style.overflow =
        'hidden';

    }



    function closeGalleryLightbox() {

      if (!lightbox) {
        return;
      }


      lightbox.classList.add(
        'hidden'
      );

      lightbox.classList.remove(
        'flex'
      );


      if (lightboxImage) {

        lightboxImage.src = '';

      }


      document.body.style.overflow =
        '';

    }



    items.forEach(item => {

      item.addEventListener(
        'click',
        () => {

          openLightbox(item);

        }
      );


      item.addEventListener(
        'keydown',
        event => {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            openLightbox(item);

          }

        }
      );

    });



    previousButton?.addEventListener(
      'click',
      event => {

        event.stopPropagation();

        showPhoto(
          currentIndex - 1
        );

      }
    );



    nextButton?.addEventListener(
      'click',
      event => {

        event.stopPropagation();

        showPhoto(
          currentIndex + 1
        );

      }
    );



    closeLightbox?.addEventListener(
      'click',
      event => {

        event.stopPropagation();

        closeGalleryLightbox();

      }
    );



    lightbox?.addEventListener(
      'click',
      event => {

        if (
          event.target === lightbox
        ) {

          closeGalleryLightbox();

        }

      }
    );



    // =========================
    // TECLADO
    // =========================

    document.addEventListener(
      'keydown',
      event => {

        if (
          !lightbox ||
          lightbox.classList.contains(
            'hidden'
          )
        ) {
          return;
        }


        if (event.key === 'Escape') {

          closeGalleryLightbox();

        }


        if (event.key === 'ArrowLeft') {

          showPhoto(
            currentIndex - 1
          );

        }


        if (event.key === 'ArrowRight') {

          showPhoto(
            currentIndex + 1
          );

        }

      }
    );



    updateVisibleCounter();

  }
);