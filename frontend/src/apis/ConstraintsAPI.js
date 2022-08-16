const consts = require('./consts.js')

const fetchConstraints = async () => {
    let res = null;

    try {
        const response = await fetch(`${consts.host}/constraints`, {
            headers: consts.standardHeaders,
            method: 'GET'
        });

        if (response.status !== 200) {
            throw new Error('Error while fetching constraints');
        }

        const data = await response.json();

        res = data;
    }
    catch (err) {
        console.error(err);
    }
    
    return res;
}

module.exports = {
    fetchConstraints: fetchConstraints
}