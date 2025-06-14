
import { LoginAttempt } from '../models/index.js';

export const checkLoginLock = async (email) => {

  const LOCK_TIME = 15 * 60 * 1000; // 15 minutos en milisegundos

  try {
    const lastAttempt = await LoginAttempt.findOne({
      where: { email },
      order: [['timestamp', 'DESC']]
    });

    if (lastAttempt) {
      const lastAttemptTimestamp = new Date(lastAttempt.timestamp).getTime();
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastAttemptTimestamp;

      if (elapsedTime < LOCK_TIME) {
        return LOCK_TIME - elapsedTime;
      } else {
        await LoginAttempt.destroy({
          where: { email }
        });
      }
    }

    return 0; // No hay bloqueo o ha pasado suficiente tiempo

  } catch (error) {
    console.error('Error al verificar el bloqueo de inicio de sesión:', error);
    throw error;
  }
};
