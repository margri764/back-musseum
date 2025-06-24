import moment from 'moment';
import { logger } from '../logger.js';

import { sequelize } from '../db/config.db.js';
import { destroyFile, uploadFile } from "../helpers/filesManagment.js";
import { Documents, HistoryFamily, Users } from "../models/index.js";


const createFamilyHistory = async (req, res) => {

  const { iduser, name, lastName, role } = req.userAuth;

  let transaction = null;

  let uploadedFile = null;

  try {

    const file = req.files.file;
    
    const { title, story } = req.body;


    if (!file) {
      return res.status(400).json({
          success: false,
          message: "Por favor, proporcione un archivo para cargar.",
      });
     }

    if (req.files && req.files.file) {
        uploadedFile = await uploadFile(req.files.file, "familyHistories");
    }


    transaction = await sequelize.transaction();


    // Insertar la referencia del documento en la base de datos
    const document = {
      name: uploadedFile.sanitizedFileName,
      type: file.mimetype,
      size: file.size,
      filePath: uploadedFile.filePath,
      iduser
    };


    const createdDocument = await Documents.create(document, {transaction});

    const newHistoryFamily = {
               title,
               story,
               iduser,
               iddocument : createdDocument.iddocument
    }  

    const historyFamily = await HistoryFamily.create(newHistoryFamily, {transaction});


      await transaction.commit();

      return res.status(200).json({
        success: true,
        historyFamily

      });

 
  } catch (error) {

    console.error('createFamilyHistory Error:', error);
    
    if(transaction){
      await transaction.rollback()
    }

    if (uploadedFile?.filePath) {
      await destroyFile(uploadedFile.filePath, "familyHistories");
    }

    const currentDate = moment().utc().format(); 
    logger.error(`createFamilyHistory: ${currentDate}, user: ${name} ${lastName}, message: ${error.message}`);
    

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}


const getAllFamilyHistories = async (req, res) => {

  try {
    const histories = await HistoryFamily.findAll({
      include: [
        {
          model: Documents,
          as: 'document',
          attributes: ['name', 'filePath', 'type', 'size']
        },
        {
         model: Users,
         as: 'user',
         attributes: ['name', 'lastName'] // o lo que necesites
        }
      ],
      order: [['createdAt','DESC']]
    });

    return res.status(200).json({
      success: true,
      histories
    });

  } catch (error) {
    console.error('❌ getAllFamilyHistories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las historias familiares.',
      error: error.message
    });
  }
};




const deleteFamilyHistory = async (req, res) => {

  const { iduser, name, lastName } = req.userAuth;
  
  const idhistory_family = req.params.id;

  let transaction = null;

  try {

    transaction = await sequelize.transaction();

    const history = await HistoryFamily.findOne({
      where: { idhistory_family, iduser },
      transaction
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Historia no encontrada o no te pertenece.',
      });
    }

    const document = await Documents.findOne({
      where: { iddocument: history.iddocument, iduser },
      transaction
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento asociado no encontrado.',
      });
    }

    // Eliminamos historia y documento en BD
    await HistoryFamily.destroy({ where: { idhistory_family }, transaction });
    await Documents.destroy({ where: { iddocument: history.iddocument }, transaction });

    await transaction.commit();

    // Eliminamos archivo físico
    await destroyFile(document.filePath, 'familyHistories');

    return res.status(200).json({
      success: true,
      message: 'Historia eliminada correctamente.',
    });

  } catch (error) {

    console.error('❌ deleteFamilyHistory error:', error);
    
    if (transaction) await transaction.rollback();

    const currentDate = moment().utc().format(); 
    logger.error(`deleteFamilyHistory: ${currentDate}, user: ${name} ${lastName}, message: ${error.message}`);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};



export {
        createFamilyHistory,
        deleteFamilyHistory,
        getAllFamilyHistories
}