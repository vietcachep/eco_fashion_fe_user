/* drift-zoom không kèm type. Khai báo phần dùng: constructor + disable/enable. */
declare module "drift-zoom" {
  interface DriftOptions {
    zoomFactor?: number;
    paneContainer?: HTMLElement;
    inlinePane?: boolean | number;
    handleTouch?: boolean;
    hoverBoundingBox?: boolean;
    containInline?: boolean;
    inlineOffsetX?: number;
    inlineOffsetY?: number;
    sourceAttribute?: string;
  }
  export default class Drift {
    constructor(triggerEl: HTMLElement, options?: DriftOptions);
    enable(): void;
    disable(): void;
  }
}
