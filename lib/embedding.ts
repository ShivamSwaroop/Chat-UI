 export function normalizeEmbedding(output: any): number[] {
           if (Array.isArray(output)) {
             if (Array.isArray(output[0])) {
               return output[0];
             }
             return output;
           }
           throw new Error("Invalid embedding format");
         }