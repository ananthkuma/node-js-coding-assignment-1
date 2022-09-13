const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("SERVER RUNNING AT LOCAL HOST 3000");
    });
  } catch (error) {
    console.log(`DB ERROR:${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//middleware function

const checkingPossibleValues = (request, response, next) => {
  const { priority, status, category, dueDate } = request.body;
  const checkPriority =
    priority === "HIGH" ||
    priority === "MEDIUM" ||
    priority === "LOW" ||
    priority === undefined;
  const checkStatus =
    status === "TO DO" ||
    status === "IN PROGRESS" ||
    status === "DONE" ||
    status === undefined;

  const checkCategory =
    category === "WORK" ||
    category === "HOME" ||
    category === "LEARNING" ||
    category === undefined;
  const checkingDate = isValid(new Date(dueDate)) || dueDate === undefined;

  if (checkPriority && checkStatus && checkCategory && checkingDate) {
    next();
  } else {
    if (checkPriority === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (checkCategory === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (checkStatus === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (checkingDate === false) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
};

const checkingQueryValues = (request, response, next) => {
  const { priority, status, category, dueDate } = request.query;
  const checkPriority =
    priority === "HIGH" ||
    priority === "MEDIUM" ||
    priority === "LOW" ||
    priority === undefined;
  const checkStatus =
    status === "TO DO" ||
    status === "IN PROGRESS" ||
    status === "DONE" ||
    status === undefined;

  const checkCategory =
    category === "WORK" ||
    category === "HOME" ||
    category === "LEARNING" ||
    category === undefined;
  const checkingDate = isValid(new Date(dueDate)) || dueDate === undefined;

  if (checkPriority && checkStatus && checkCategory && checkingDate) {
    next();
  } else {
    if (checkPriority === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (checkCategory === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (checkStatus === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (checkingDate === false) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
};

//Returns TODOS API
const getTodoResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", checkingQueryValues, async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE 
             priority='${priority}' AND status ='${status}';`;
      break;
    case hasCategoryAndStatus(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE
            category='${category}' AND status ='${status}';`;
      break;
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE 
             category='${category}' AND priority ='${priority}';`;
      break;
    case hasCategory(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE 
            category='${category}';`;
      break;
    case hasStatus(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE 
            status='${status}';`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE 
             priority='${priority}';`;
      break;
    default:
      getTodosQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data.map((eachObj) => getTodoResponseObject(eachObj)));
});

//get specific todo API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const getTodo = await db.get(getTodoQuery);
  response.send(getTodoResponseObject(getTodo));
});

//date MiddleWare function
const dateChecking = (request, response, next) => {
  const { date } = request.query;
  const checkingValid = isValid(new Date(date));
  if (checkingValid) {
    next();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

app.get("/agenda/", dateChecking, async (request, response) => {
  const { date } = request.query;
  const formatDate = format(new Date(date), "yyyy-MM-dd");
  const getTodoQuery = `SELECT * FROM todo WHERE due_date = '${formatDate}';`;
  const todo = await db.get(getTodoQuery);
  response.send(getTodoResponseObject(todo));
});

//adding todo API
app.post("/todos/", checkingPossibleValues, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const formateDate = format(new Date(dueDate), "yyyy-MM-dd");
  const addTodoQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${category}','${status}','${formateDate}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//update todo API
app.put(
  "/todos/:todoId/",
  checkingPossibleValues,
  async (request, response) => {
    const { todoId } = request.params;
    let updatedColumn = "";
    const requestBody = request.body;

    switch (true) {
      case requestBody.status !== undefined:
        updatedColumn = "Status";
        break;
      case requestBody.priority !== undefined:
        updatedColumn = "Priority";
        break;
      case requestBody.todo !== undefined:
        updatedColumn = "Todo";
        break;
      case requestBody.category !== undefined:
        updatedColumn = "Category";
        break;
      case requestBody.dueDate !== undefined:
        updatedColumn = "Due Date";
        break;
    }

    const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
    const previousTodo = await db.get(previousTodoQuery);

    const {
      todo = previousTodo.todo,
      status = previousTodo.status,
      priority = previousTodo.priority,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body;

    const updateTodoQuery = `UPDATE todo 
     SET 
        todo='${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}'
     WHERE 
         id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updatedColumn} Updated`);
  }
);

//delete todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
