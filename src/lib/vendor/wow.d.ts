/* Khai báo tối thiểu cho wow.js chép từ Vineta (`utlis/wow.js`). */
declare module "@/lib/vendor/wow.js" {
  interface WowOptions {
    boxClass?: string;
    animateClass?: string;
    offset?: number;
    mobile?: boolean;
    live?: boolean;
    callback?: (box: HTMLElement) => void;
    scrollContainer?: string | null;
  }
  class WOW {
    constructor(options?: WowOptions);
    init(): void;
    sync(): void;
  }
  export default WOW;
}
