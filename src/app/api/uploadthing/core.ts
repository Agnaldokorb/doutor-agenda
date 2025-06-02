import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlice
  profileImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.uploadedBy);

      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
    }),

  // Endpoint para upload de imagens gerais (logos, documentos, etc.)
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      // This code runs on your server before upload
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Image upload complete for:", metadata.uploadedBy);
      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
