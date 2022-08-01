const fetchConstraints = async () => {
    let res = null;

    try {
        const response = await fetch('http://localhost:3001/api/constraints', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'access_token': sessionStorage.getItem('access_token')
            },
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
    fetchConstraints: fetchConstraints,
}