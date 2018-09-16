let id = 0
let taskCounter = 0
let tasks = {}

function getNextId(){
    return ++id
}

function getNextTaskCounter(){
    return ++taskCounter
}

function loadStoreTasks(){
    $.ajax({
        url: '/api/task',
        method: 'get',
        dataType: 'json',
        success: (res) => {
            console.log(res)

            id = taskCounter = res.last_id

            let list = res.list
            for(let t of list){
                if(t.status){
                    addTaskTodoList(t)
                }
                else{
                    addTaskCompletedList(t)
                }
            }
        },
    })
}

function createTask(name, user, id = null){
    let task = {
        'id': id ? id : getNextId(),
        'name': name,
        'user': user
    }

    tasks[task.id] = task

    $.ajax({
        url: '/api/newtask',
        method: 'post',
        data: task,
        dataType: 'json',
        success: (res) => {
            console.log(res)
        }
    })

    return task
}

function getTask(id){
    return tasks[id];
}

function editTask(id, name, user){
    let task = getTask(id)
    task.name = name
    task.user = user

    $.ajax({
        url: '/api/task/' + task.id + '/edit',
        method: 'post',
        data: {
            name: name,
            user: user
        },
        dataType: 'json',
        success: (res) => {
            console.log(res)
        }
    })
}

function removeTask(task){

    delete tasks[task.id]

    $.ajax({
        url: '/api/task/' + task.id + '/remove',
        method: 'post',
        dataType: 'json',
        success: (res) => {
            console.log(res)
        }
    })
}

function getTaskHtml(task, i = 1){
    var taskHTML = '<li data-tid="' + task.id + '">'
    taskHTML += '<span class="num">' + i + '</span>'
    taskHTML += '<span class="done">%</span>';
    taskHTML += '<span class="edit"> + </span>';
    taskHTML += '<span class="delete"> x </span>';
    taskHTML += '<span class="task">' + task.name + '</span>';
    taskHTML += '<span class="user">' + task.user + '</span>'
    taskHTML += '</li>';
    return taskHTML
}

function addTaskTodoList(task){

    tasks[task.id] = task

    let html = getTaskHtml(task, task.id ? task.id : getNextTaskCounter())
    $('#todo-list').append(html)
}

function addTaskCompletedList(task){

    tasks[task.id] = task

    let html = getTaskHtml(task, task.id)
    $('#completed-list').append(html)
}

function taskComplete(task){
    $.ajax({
        url: '/api/task/' + task.id + '/complete',
        method: 'post',
        dataType: 'json',
        success: (res) => {
            console.log(res)
        }
    })
}
function taskTodo(task){
    $.ajax({
        url: '/api/task/' + task.id + '/todo',
        method: 'post',
        dataType: 'json',
        success: (res) => {
            console.log(res)
        }
    })
}

$(document).ready( () => {
    $('#new-todo-dialog').dialog({
        model: true,
        autoOpen: false,
        buttons: {
            "Add Task": function(){
                let name = $('#new-name').val()
                let user = $('#new-user').val()

                if(name === "" || user === ""){
                    return false;
                }

                let newTask = createTask(name, user)
                addTaskTodoList(newTask)

                $(this).dialog('close')
            },
            "Cancel": function(){
                $(this).dialog('close')
            }
        }
    })

    $('#add-todo').on('click', () => {
        $('#new-todo-dialog').dialog('open')
    })

    $('.sortlist').sortable({
        connectWith: '.sortlist',
        cursor: 'pointer',
        placeholder: 'ui-state-highlight',
        cancel: '.delete,.done',
        receive: function(e, ui){
            let list = $(this)
            let it = $(ui.item[0])

            let taskid = it.data('tid')

            if( $(list[0]).is('#todo-list') ){
                taskTodo(getTask(taskid))
            }
            if( $(list[0]).is('#completed-list') ){
                taskComplete(getTask(taskid))
            }
        }
    });

    $('#todo-list').on('click', '.done', function(){
        let li = $(this).parent('li')
        let taskid = li.data('tid')

        li.detach()
        $('#completed-list').prepend(li)

        taskComplete(getTask(taskid))
    })

    $('.sortlist').on('click', '.edit', function () {
        var taskElement = $(this).siblings('.task')
        var taskText = taskElement.text()
        var userElement = $(this).siblings('.user')
        var userText = userElement.text()

        let li = $(this).parent('li')
        let taskid = li.data('tid')

        $('#edit-name').val(taskText)
        $('#edit-user').val(userText)

        //console.log(taskText)
        $('#edit-todo-dialog').dialog({
            modal: true, autoOpen: true,
            buttons: {
                "Edit task": function () {
                    $(this).dialog('close');
                    var newTask = $('#edit-name').val()
                    taskElement.text(newTask)
                    var newUser = $('#edit-user').val()
                    userElement.text(newUser)
                    editTask(taskid, newTask, newUser)
                },
                "Cancel": function () {
                    $(this).dialog('close');
                }
            }
        });
    });

    $('.sortlist').on('click', '.delete', function () {

        var _this = this

        let li = $(this).parent('li')
        let taskid = li.data('tid')

        $("#dialog-confirm").dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "Confirm": function () {
                    $(this).dialog("close");
                    $(_this).parent('li').effect('puff', function () {
                        $(_this).remove();
                    });
                    removeTask(getTask(taskid))
                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        });
    });

    loadStoreTasks()
})