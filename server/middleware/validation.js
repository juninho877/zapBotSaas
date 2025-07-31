const validateUser = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    next();
};

const validateGroupConfig = (req, res, next) => {
    const { prefix } = req.body;

    if (prefix && (prefix.length > 10 || !/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(prefix))) {
        return res.status(400).json({ error: 'Invalid prefix format' });
    }

    next();
};

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

module.exports = {
    validateUser,
    validateLogin,
    validateGroupConfig
};