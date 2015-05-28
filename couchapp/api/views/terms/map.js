function(doc) {
    if (doc) {
        if (doc && doc.type && doc.type.toLowerCase() === 'term') {
            emit(doc.uniqueId, doc);
        }
    }
}