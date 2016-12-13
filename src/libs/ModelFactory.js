/**
 * Created by zppro on 15-12-14.
 */
var mongoose = require('mongoose');

var ModelFactory = function(conn) {
    if (conn == null) {
        conn = mongoose.connection;
    }
    ModelFactory.context = this;

    return {
        create: function (name, path, data) {
            return ModelFactory._create(ModelFactory.getModel(conn, name, path), data);
        },
        model_create: function (model, data) {
            return ModelFactory._create(model, data);
        },
        read: function (name, path, id) {
            return ModelFactory._read(ModelFactory.getModel(conn, name, path), id);
        },
        model_read: function (model, id) {
            return ModelFactory._read(model, id);
        },
        update: function (name, path, id, data) {
            return ModelFactory._update(ModelFactory.getModel(conn, name, path), id, data);
        },
        model_update: function (model, id, data) {
            return ModelFactory._update(model, id, data);
        },
        delete: function (name, path, id) {
            return ModelFactory._delete(ModelFactory.getModel(conn, name, path), id);
        },
        model_delete: function (model, id) {
            return ModelFactory._delete(model, id);
        },
        query: function (name, path, data,options) {
            return ModelFactory._query(ModelFactory.getModel(conn, name, path), data, options);
        },
        model_query: function (model, data, options) {
            return ModelFactory._query(model, data, options);
        },
        totals: function (name, path, data) {
            return ModelFactory._query(ModelFactory.getModel(conn, name, path), {where: data, select: '_id'});
        },
        model_totals: function (model, data) {
            return ModelFactory._query(model, {where: data, select: '_id'});
        },
        one: function (name, path, data) {
            return ModelFactory._one(ModelFactory.getModel(conn, name, path), data);
        },
        model_one: function (model, data) {
            return ModelFactory._one(model, data);
        },
        bulkInsert: function (name, path, data) {
            return ModelFactory._bulkInsert(ModelFactory.getModel(conn, name, path), data);
        },
        model_bulkInsert: function (model, data) {
            return ModelFactory._bulkInsert(model, data);
        },
        bulkUpdate: function (name, path, data) {
            return ModelFactory._bulkUpdate(ModelFactory.getModel(conn, name, path), data);
        },
        model_bulkUpdate: function (model, data) {
            return ModelFactory._bulkUpdate(model, data);
        },
        bulkDelete: function (name, path, where) {
            return ModelFactory._bulkDelete(ModelFactory.getModel(conn, name, path), where);
        },
        model_bulkDelete: function (model, where) {
            return ModelFactory._bulkDelete(model, where);
        },
        distinct: function (name, path, data) {
            return ModelFactory._distinct(ModelFactory.getModel(conn, name, path), data);
        },
        model_distinct: function (model, data) {
            return ModelFactory._distinct(model, data);
        },
        aggregate:function (name,path,pipes){
            return ModelFactory._aggregate(ModelFactory.getModel(conn, name, path),pipes);
        },
        model_aggregate: function (model, pipes) {
            return ModelFactory._aggregate(model, pipes);
        }
    };
};

ModelFactory.models = {};

ModelFactory.loadModel = function(modelStructureLevelObject) {
    if (!modelStructureLevelObject.hasOwnProperty('name') && !modelStructureLevelObject.hasOwnProperty('path')) {
        for (var key in modelStructureLevelObject) {

            ModelFactory.loadModel.bind(this)(modelStructureLevelObject[key]);
        }
    }
    else {
        ModelFactory.models[modelStructureLevelObject.relative_name] = require('../models/' + modelStructureLevelObject.relative_path)(this, modelStructureLevelObject.relative_name);
    }
}

ModelFactory.getModel = function (conn,name,path) {
    var model = ModelFactory.models[name];
    if (!model) {
        console.log('dynamic load model ' + name);
        model = require(path)(this.context, name);
    }
    return model;
    //if (conn == null) {
    //    conn = mongoose.connection;
    //}
    //return conn.model(name, require(path)(this.context, name));
};

ModelFactory._create =function (model,data) {
    return model.create(new model(data));
};

ModelFactory._read =function (model,id) {
    return model.findById(id);
};

ModelFactory._update =function (model,id,data) {
    return model.update({_id: id}, {$set: data});
};

ModelFactory._delete =function (model,id) {
    return model.remove({_id: id});
};

ModelFactory._query =function (model,data,options) {
    var rows;
    if (data) {
        options = options || {};
        if (data.page && data.page.size) {
            !options.limit && (options.limit = data.page.size)
        }
        if (data.page && data.page.no) {
            !options.skip && (options.skip = (data.page.no - 1) * data.page.size);
        }

        //此处因为mongodb不允许[挑选]、[排除]字段同时存在（_id）不受限
        if(!data.select && model.schema.$$skipPaths) {
            var skipSelects = this.context._.map(model.schema.$$skipPaths, function (o) {
                return '-' + o;
            }).join(' ');
            data.select = skipSelects;
        }

        if (data.sort) {
            rows = model.find(data.where, data.select, options).sort(data.sort);
        }
        else {
            rows = model.find(data.where, data.select, options);
        }
    }
    else {
        rows = model.find();
    }

    return rows;
};


ModelFactory._one =function (model,data) {
    if (data) {
        return model.findOne(data.where, data.select, data.options);
    }
    else {
        return model.findOne();
    }
};

ModelFactory._bulkInsert =function (model,data) {
    var canInsert = true;
    if(data.removeWhere) {
        console.log(1);
        model.remove(data.removeWhere, function (err) {
            if (err) {
                canInsert = false;
                throw err;
            }
        });
    }

    if(canInsert) { 
        return model.insertMany(data.rows);
    }
};

ModelFactory._bulkUpdate = function (model,data) {
    if (data && data.conditions && data.batchModel) {
        return model.update(data.conditions, data.batchModel, {multi: true});
    }
    return {error: {code: 'E59999', message: 'params error'}}
};

//非常危险，防止误删除
ModelFactory._bulkDelete = function (model,where) {
    where = where || {};
    return model.remove(where);
};


ModelFactory._distinct = function(model,data) {
    return model.distinct(data.select, data.where);
};

ModelFactory._aggregate =function (model,pipes) {
    return model.aggregate(pipes);
};


//对数组类型子文档的增加和删除
//model.findByIdAndUpdate(23, {
//    '$pull': {
//        'contacts':{ '_id': new ObjectId(someStringValue) }
//    },
//    '$push'?
//});

//对数组类型子文档的修改
//schemaModel.update({name:'loong'},{$set:{‘arraySubDoc.$’:{age:26}}});


module.exports = ModelFactory;