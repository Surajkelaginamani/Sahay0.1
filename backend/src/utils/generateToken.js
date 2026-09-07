import jwt from 'jsonwebtoken';

const generateToken = (userId, role, hospitalId = null) => {
  return jwt.sign(
    { id: userId, role, hospitalId },
    process.env.JWT_SECRET || 'sahay_jwt_secret_dev_key_2026',
    {
      expiresIn: '30d',
    }
  );
};

export default generateToken;
