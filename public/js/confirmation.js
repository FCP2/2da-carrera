document.addEventListener('DOMContentLoaded', () => {

  const pulse =
    document.getElementById('statusPulse');

  const check =
    document.getElementById('statusCheck');

  const text =
    document.getElementById('statusText');

  const subtext =
    document.getElementById('statusSubtext');


  if (!pulse || !check || !text || !subtext) {
    return;
  }


  setTimeout(() => {

    pulse.classList.remove('opacity-0');

    pulse.animate(
      [
        {
          transform: 'scale(0.6)',
          opacity: 0
        },
        {
          transform: 'scale(1)',
          opacity: 1
        },
        {
          transform: 'scale(1.4)',
          opacity: 0
        }
      ],
      {
        duration: 900,
        easing: 'ease-out'
      }
    );

  }, 250);


  setTimeout(() => {

    check.classList.remove(
      'opacity-0',
      'scale-50'
    );

    check.classList.add(
      'opacity-100',
      'scale-100'
    );

  }, 450);


  setTimeout(() => {

    text.classList.remove('opacity-0');
    text.classList.add('opacity-100');

  }, 650);


  setTimeout(() => {

    subtext.classList.remove('opacity-0');
    subtext.classList.add('opacity-100');

  }, 800);

});