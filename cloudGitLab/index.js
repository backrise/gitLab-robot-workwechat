'use strict';

const HEADER_KEY = "x-gitlab-event";

const eventHandMap = {
    'Issue Hook': handleIssue,
    'Push Hook': handlePush,
    'Tag Push Hook': handlePushTag,
    'push': handlePush,
    'tag_push': handlePushTag,
    'merge_request': handlePR,
    'Merge Request Hook': handlePR
};

const ChatRobot = require('./chat');

/**
 * 处理push事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
function handlePush(body, robotid) {
    let {user_name, ref, project:{name:proName, web_url}, commits} = body;
    const lastCommit = commits[commits.length - 1];
    const lastCommitMsg = lastCommit ?
`commitID: ${lastCommit.id}
提交信息: ${lastCommit.message}`
: ''
;
    const mdMsg =
`项目 [${proName}](${web_url}) 收到一次push提交
地址: [${web_url}](${web_url})
提交者:  ${user_name}
分支: ${ref}
${lastCommitMsg}`
    return mdMsg;
}

/**
 * 处理push tag事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
function handlePushTag(body, robotid) {
    let {user_name, ref, project:{name:proName, web_url}, commits} = body;
    const lastCommit = commits[commits.length - 1];
    const lastCommitMsg = lastCommit ?
`commitID: ${lastCommit.id}
提交信息: ${lastCommit.message}`
: ''
;
    const mdMsg =
`项目 [${proName}](${web_url}) 收到一次push tag提交
地址: [${web_url}](${web_url})
提交者:  ${user_name}
分支: ${ref}
${lastCommitMsg}`
    return mdMsg;
}

/**
 * 处理merge request事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
function handlePR(body, robotid) {
    let {object_kind='', user:{name, avatar_url}, project:{name:proName, web_url}, object_attributes:{title, state, target_branch, source_branch, url}} = body;
    const mdMsg =
`[${name}](${avatar_url})在 [${proName}](${web_url}) 中${state}了一次${object_kind}
地址: [${web_url}](${web_url})
标题: ${title}
源分支: ${source_branch}
目标分支: ${target_branch}
[查看PR详情](${url})`;
    return mdMsg;
}

/**
 * 处理issue 事件
 * @param ctx koa context
 * @param robotid 机器人id
 */
function handleIssue(body, robotid) {
    let {user: {name, avatar_url}, project: {name:proName ,web_url}, object_attributes: {title, url, action}} = body;
    const mdMsg =
`[${name}](${avatar_url}) 在 [${proName}](${web_url}) 中 ${action} 了一个issue
地址: [${web_url}](${web_url})
标题: ${title}
发起人: [${name}](${avatar_url})
[查看详情](${url})`;
    return mdMsg;
}

/**
 * 对于未处理的事件，统一走这里
 * @param ctx koa context
 * @param event 事件名
 */
function handleDefault(event) {
    return `Sorry，暂时还没有处理${event}事件`;
}

const jokes = require('./jokes');
const cold_jokes = require('./cold_jokes');

function RandArray(array){
    var rand = Math.random()*array.length | 0;
    var rValue = array[rand];
    return rValue;
}

exports.main_handler = async (event) => {
    const headersKey = event.headers[HEADER_KEY];
    const date = new Date()
    const robotid = event.queryString.id;
    const bodyObj = JSON.parse(event.body);
    const gitEvent = bodyObj.event_name || bodyObj.object_kind;
    const f = eventHandMap[headersKey] || eventHandMap[gitEvent];
    const robot = new ChatRobot(
        robotid
    );
    if(f) {
        let mdMsg = f(bodyObj, robotid);
        const hour = (date.getHours() + 8) % 24;
        if(9 <= hour && hour <= 21) {
            mdMsg += `

提交了代码, 就喝口水休息一会.
- - - - - - - - - - - - - - -
轻松一刻: ${RandArray(jokes)}
`;
        } else {
            mdMsg += `

现在${hour}点, 是休息时间, 请停止你的内卷行为. 点名批评!
- - - - - - - - - - - - - - -
毒鸡汤一则: ${RandArray(cold_jokes)}
`;
        }
        await robot.sendMdMsg(mdMsg);
        return mdMsg;
    }
    return handleDefault(gitEvent);
};
