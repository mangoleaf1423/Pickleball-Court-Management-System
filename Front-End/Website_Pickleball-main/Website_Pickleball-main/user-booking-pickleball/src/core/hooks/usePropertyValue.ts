const usePropertyValue = (key: string) => {
  return window.getComputedStyle(document.documentElement).getPropertyValue(key);
};

export default usePropertyValue;
