'user strict';

const { Contract } = require('fabric-contract-api')

const recordObjType = "Records";

class ReportsContract extends Contract {

     _getResultsForQueryString(ctx, queryStr) {
        const iteratorPromise = ctx.stub.getQueryResult(queryStr);
        let result = [];

        for await (const res of iteratorPromise) {
            result.push(JSON.parse(res.value,toString()));
        }

        return JSON.stringify(result);
    }

    async init(ctx){
        const records = [
            {
                id: "id1",
                name: "goods1",
                price: 100.0,
                date: {
                        day: 1,
                        month: 1,
                        year: 2018
                    }
            }, {
                id: "id2",
                name: "goods2",
                price: -90.0,
                date: {
                        day: 12,
                        month: 2,
                        year: 2019
                }
            }, {
                id: "id3",
                name: "goods3",
                price: 75.0,
                date: {
                        day: 27,
                        month: 5,
                        year: 2020
                }
            }
        ];

        for (const record of records) {
            const compKey = ctx.stub.createComopositeKey(recordObjType,[record.id]);
            await ctx.stub.putState(compKey,Buffer.from(JSON.stringify(record)));
        }
    }

    async putRecord(ctx, id, name, price, dateStr) {

        const date = new Date(dateStr);

        const record = {
            id : id,
            name : name,
            price : parseFloat(price),
            date : {
                day: date.getDate(),
                month: date.getMonth(),
                year: date.getFullYear()
            }
        }

        const compKey = ctx.stub.createComopositeKey(recordObjType,[id])

        const recordBytes = ctx.stub.getState(compKey)

        if (recordBytes && recordBytes.length > 0) {
            throw new Error(`The record ${record.id} already exists.`);
        }

        await ctx.stub.putState(compKey, Buffer.from(JSON.stringify(record)));

    }

    async getAnnualRecord(ctx, year) {

        const queryStr = `{
                            "selector":{
                                "date":{
                                    "year":${year}
                                }
                            },
                            "use_index": ["_design/indexYearDoc", "indexYear"]
                        }`;
        return this._getResultsForQueryString(ctx,queryStr);

    }

    async generateCustomReport(ctx, queryStr) {
        return this._getResultsForQueryString(ctx, queryStr);
    }


}

module.exports = ReportsContract;