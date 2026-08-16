
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const docWidth = document.documentElement.scrollWidth;

  const overflowing = [...document.querySelectorAll("*")].filter((el) => {
    const rect = el.getBoundingClientRect();
    if (el.closest('.product-gallery__mobile-thumbs') || el.closest('.size-guide-modal__table-wrap')) return false;
    return rect.right > viewportWidth + 1 || rect.left < -1;
  }).map(el => ({
    tagName: el.tagName,
    className: el.className,
    id: el.id,
    right: el.getBoundingClientRect().right,
    viewportWidth: viewportWidth
  }));

  console.log("RESULT_START:" + JSON.stringify({
    viewportWidth,
    viewportHeight,
    docWidth,
    hasHorizontalScroll: docWidth > viewportWidth,
    overflowCount: overflowing.length,
    overflowingElements: overflowing
  }) + ":RESULT_END");
