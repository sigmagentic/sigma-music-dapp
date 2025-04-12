export const scrollToTop = () => {
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};
