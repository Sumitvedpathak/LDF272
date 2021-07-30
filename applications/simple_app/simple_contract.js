

async emitEvent(ctx, name, payload){
    ctx.stub.setEvent(name, Buffer.from(payload));
};