
export const generatePassword = async () => {
    const alphanumericCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
  
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * alphanumericCharacters.length);
      password += alphanumericCharacters.charAt(randomIndex);
    }
  
    return password;
  }
  
  