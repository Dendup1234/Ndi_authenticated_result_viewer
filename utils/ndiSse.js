const clients = new Map();

export const addClient = (threadId, res) => {
    clients.set(threadId, res);
};

export const removeClient = (threadId) => {
    clients.delete(threadId);
};

export const sendToClient = (threadId, event, data) => {
    const client = clients.get(threadId);

    if (!client) {
        return false;
    }

    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);

    return true;
};