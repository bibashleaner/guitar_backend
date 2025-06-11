export function setupSocketIO(io, db) {
    const changeStream = db.collection('artists').watch([], {
        fullDocument: 'updateLookup',
    });
    changeStream.on('change', (change) => {
        console.log('Artists collection changed:', change.operationType);
        io.emit('artistsChanged', change);
    });
}
