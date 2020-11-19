

const http = require('http');
const renderStyle = require('./includes/index');

http.createServer((req, res) => {
    let body = [];

    req.on('data', (chunk) => {
        body.push(chunk);
    }).on('end', async() => {
        body = Buffer.concat(body).toString();

        try {
            const payload = JSON.parse(body);

            const css = await renderStyle({
                source: payload.source,
                data: payload.data,
                options: payload.options
            });

            onSuccess(css);
        }
        catch (err) {
            onError(err);
        }
    }).on('error', (err) => {
        onError(err);
    });

    function onError(err) {
        console.error('ERROR: ', err);

        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 0, error: err.message || err }));
    }

    function onSuccess(content) {
        if (content && typeof content !== 'string') {
            content = JSON.stringify(content);
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'plain/text');
        res.end(content);
    }
}).listen('8080', '0.0.0.0');
