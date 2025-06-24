
import fs from 'fs';
import crypto from 'crypto';
import path from "path";

export const uploadFile = async (  file, folder )=>{

            const fileBuffer = fs.readFileSync(file.tempFilePath);
        
            const sanitizedFileName = file.name.replace(/\s+/g, '_');
        
            const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

            const fileName = `${md5Hash}_${sanitizedFileName}`;
            
            const currentDir = path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
        
            // Construir la ruta al directorio 
            const accountDir = path.join(currentDir, `../../${folder}`);

        
            // Asegurarse de que el directorio  exista, si no, créalo
            if (!fs.existsSync(accountDir)) {
              fs.mkdirSync(accountDir);
            }
        
            // Construir la ruta completa del archivo
            const filePath = path.join(accountDir, fileName);

            // Guardar el archivo en el servidor
            fs.writeFileSync(filePath, fileBuffer);

            // Guardar solo el nombre del archivo o el path relativo en la base de datos
                const relativeFilePath = path.relative(accountDir, filePath);


            return { filePath: relativeFilePath, sanitizedFileName };

}


export const destroyFile = async (filePathRelative, folder) => {
  try {
    const currentDir = path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
    const accountDir = path.join(currentDir, `../../${folder}`);
    const absoluteFilePath = path.join(accountDir, filePathRelative);

    if (fs.existsSync(absoluteFilePath)) {
      fs.unlinkSync(absoluteFilePath);
      console.log('🗑 Archivo eliminado correctamente:', absoluteFilePath);
      return { success: true };
    } else {
      console.warn('⚠️ Archivo no encontrado:', absoluteFilePath);
      return { success: false, message: 'Archivo no encontrado' };
    }
  } catch (error) {
    console.error('❌ Error eliminando archivo:', error.message);
    return { success: false, message: error.message };
  }
};
