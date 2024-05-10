
const generateRandomString = (minLength, maxLength) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|[]\\;\':"<>?,./';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let randomString = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        randomString += charset[randomIndex];
    }
    
    return randomString
}


module.exports = {generateRandomString}