module.exports = ({ Nunjucks, _ }) => {

    var typeMap = new Map()
    typeMap.set('integer', 'int')
    typeMap.set('string', 'String')

    var formatMap = new Map()
    formatMap.set('string', '%s')
    formatMap.set('enum', '%s')
    formatMap.set('integer', '%d')

    Nunjucks.addFilter('artifactId', ([info, params]) => {
        var ret = ''
        if (params['maven-artifact-id']) {
            ret = params['maven-artifact-id']
        } else if (info.extensions()['x-maven-artifact-id']) {
            ret = info.extensions()['x-maven-artifact-id']
        } else if (info.title()) {
            ret = _.kebabCase(info.title())
        } else {
            throw new Error("Can't determine the maven artifact id. Please set the param maven-artifact-id, or element info.title or info.x-maven-artifact-id.")
        }
        return ret
    })

    Nunjucks.addFilter('camelCase', (str) => {
        return _.camelCase(str)
    })

    Nunjucks.addFilter('contentType', (channel) => {

        console.log("contentType start")
        var ret;

        if (channel.hasPublish()) {
            ret = contentType(channel.publish())
        }
        if (!ret && channel.hasSubscribe()) {
            ret = contentType(channel.subscribe())
        }

        console.log("contentType " + ret)
        return ret
    })

    Nunjucks.addFilter('deliveryMode', (channel) => {
        val = channel.publish()._json.bindings.solace.deliveryMode
        if (!val) {
            ret = 'DIRECT'
        } else {
            ret = _.upperCase(val)
            if (ret != 'DIRECT' && ret != 'PERSISTENT') {
                throw new Error("delivery mode must be direct or persistent. Found: " + val)
            }
        }

        return ret;
    })

    function contentType(pubOrSub) {
        return pubOrSub._json.message.contentType
    }

    Nunjucks.addFilter('dump', dump)

    Nunjucks.addFilter('fixType', (str) => {
        var ret = typeMap.get(str)
        if (!ret) {
            ret = str
        }
        return ret
    })

    Nunjucks.addFilter('groupId', ([info, params]) => {
        var ret = ''
        if (params['maven-group-id']) {
            ret = params['maven-group-id']
        } else if (info.extensions()['x-maven-group-id']) {
            ret = info.extensions()['x-maven-group-id']
        } else {
            throw new Error("Can't determine the maven group id. Please set the param maven-group-id or element info.x-maven-group-id.")
        }
        return ret
    })

    Nunjucks.addFilter('kebabCase', (str) => {
        return _.kebabCase(str)
    })

    Nunjucks.addFilter('lowerFirst', (str) => {
        return _.lowerFirst(str)
    })

    Nunjucks.addFilter('messageClass', ([channelName, channel]) => {
        var ret = messageClass(channel.publish())
        if (!ret) {
            ret = messageClass(channel.subscribe())
        }
        if (!ret) {
            throw new Error("Channel " + channelName + ": no message class has been defined.")
        }
        return ret
    })

    Nunjucks.addFilter('payloadClass', ([channelName, channel]) => {
        var ret = payloadClass(channel.publish())
        if (!ret) {
            ret = payloadClass(channel.subscribe())
        }
        if (!ret) {
            throw new Error("Channel " + channelName + ": no payload class has been defined.")
        }
        return ret
    })

    Nunjucks.addFilter('queueInfo', ([channelName, channel, subscribeTopic]) => {
        var ret = {}
        ret.isQueue = false;
        var bindings = channel._json.bindings.solace
        console.log("bindings: " + JSON.stringify(bindings))
        if (bindings) {
            ret.isQueue = bindings.is === 'queue'
            if (!ret.isQueue && bindings.queue && !bindings.queue.name) {
                throw new Exception("Channel " + channelName + " please provide a queue name.");
            }
            ret.needQueue = ret.isQueue || bindings.queue.name
            ret.queueName = bindings.queue && bindings.queue.name ? bindings.queue.name : channelName
            ret.accessType = bindings.queue && bindings.queue.exclusive ? "ACCESSTYPE_EXCLUSIVE" : "ACCESSTYPE_NONEXCLUSIVE"
            if (bindings.queue && bindings.queue.subscription) {
                ret.subscription = bindings.queue.subscription
            } else if (!ret.isQueue) {
                ret.subscription = subscribeTopic
            }
        }
        console.log("queueInfo: " + JSON.stringify(ret))
        return ret;
    })

    Nunjucks.addFilter('toJson', (object) => {
        return JSON.stringify(object)
    })

    Nunjucks.addFilter('topicInfo', ([channelName, channel]) => {
        var ret = {}
        var publishTopic = String(channelName)
        var subscribeTopic = String(channelName)
        var params = []
        var functionParamList = ""
        var functionArgList = ""
        var first = true

        console.log("params: " + JSON.stringify(channel.parameters()))
        for (var name in channel.parameters()) {
            var nameWithBrackets = "{" + name + "}"
            var schema = channel.parameter(name)['_json']['schema']
            //console.log("schema: " + dump(schema))
            var type = schema.type
            var param = { "name": _.lowerFirst(name) }

            if (first) {
                first = false
            } else {
                functionParamList += ", "
                functionArgList += ", "
            }

            if (type) {
                //console.log("It's a type: " + type)
                var javaType = typeMap.get(type)
                if (!javaType) throw new Error("topicInfo filter: type not found in typeMap: " + type)
                param.type = javaType
                var printfArg = formatMap.get(type)
                //console.log("printf: " + printfArg)
                if (!printfArg) throw new Error("topicInfo filter: type not found in formatMap: " + type)
                //console.log("Replacing " + nameWithBrackets)
                publishTopic = publishTopic.replace(nameWithBrackets, printfArg)
            } else {
                var en = schema.enum
                if (en) {
                    //console.log("It's an enum: " + en)
                    param.type = _.upperFirst(name)
                    param.enum = en
                    //console.log("Replacing " + nameWithBrackets)
                    publishTopic = publishTopic.replace(nameWithBrackets, "%s")
                } else {
                    throw new Error("topicInfo filter: Unknown parameter type: " + JSON.stringify(schema))
                }
            }

            subscribeTopic = subscribeTopic.replace(nameWithBrackets, "*")
            functionParamList += param.type + " " + param.name
            functionArgList += param.name
            params.push(param)
        }
        ret.functionArgList = functionArgList
        ret.functionParamList = functionParamList
        ret.channelName = channelName
        ret.params = params
        ret.publishTopic = publishTopic
        ret.subscribeTopic = subscribeTopic
        return ret
    })

    Nunjucks.addFilter('upperFirst', (str) => {
        return _.upperFirst(str)
    })

    function dump(obj) {
        var s = '' + typeof obj
        for (const p in obj) {
            s += " "
            s += p
        }
        return s
    }

    function messageClass(pubOrSub) {
        var ret

        if (pubOrSub && pubOrSub._json && pubOrSub._json.message) {
            ret = _.upperFirst(pubOrSub._json.message.name)
        }

        return ret
    }

    function payloadClass(pubOrSub) {
        var ret

        if (pubOrSub && pubOrSub._json && pubOrSub._json.message && pubOrSub._json.message.payload) {
            ret = _.upperFirst(pubOrSub._json.message.payload.title)
        }

        return ret
    }

}
