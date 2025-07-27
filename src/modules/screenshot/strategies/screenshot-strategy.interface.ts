export interface ScreenshotStrategy {
  save(file: Express.Multer.File, filename: string): Promise<string>;
  getUrl(filename: string): string;
  delete(filename: string): Promise<void>;
}
