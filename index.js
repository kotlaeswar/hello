const todoList = () => {
  all = [];

  const add = (todoItem) => {
    all.push(todoItem);
  };

  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const overdue = () => {
    const currentDate = new Date();
    return all.filter((item) => new Date(item.dueDate) < currentDate && !item.completed);
  };

  const dueToday = () => {
    const currentDate = new Date();
    return all.filter((item) => new Date(item.dueDate).toDateString() === currentDate.toDateString() && !item.completed);
  };

  const dueLater = () => {
    const currentDate = new Date();
    return all.filter((item) => new Date(item.dueDate) > currentDate && !item.completed);
  };

  const toDisplayableList = (list) => {
    return list.map((item) => `[${item.completed ? 'x' : ' '}] ${item.title} ${formattedDate(new Date(item.dueDate))}`).join('\n');
  };

  const formattedDate = (d) => {
    return d.toISOString().split("T")[0];
  };

  return { all, add, markAsComplete, overdue, dueToday, dueLater, toDisplayableList };
};

// #######################################
// DO NOT CHANGE ANYTHING BELOW THIS LINE.
// #######################################

const todos = todoList();
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

todos.add({ title: 'Submit assignment', dueDate: yesterday, completed: false });
todos.add({ title: 'Pay rent', dueDate: today, completed: true });
todos.add({ title: 'Service vehicle', dueDate: today, completed: false });
todos.add({ title: 'File taxes', dueDate: tomorrow, completed: false });
todos.add({ title: 'Pay electric bill', dueDate: tomorrow, completed: false });

console.log("My Todo-list\n");
console.log("Overdue");
var overdues = todos.overdue();
var formattedOverdues = todos.toDisplayableList(overdues);
console.log(formattedOverdues);
console.log("\nDue Today");
let itemsDueToday = todos.dueToday();
let formattedItemsDueToday = todos.toDisplayableList(itemsDueToday);
console.log(formattedItemsDueToday);
console.log("\nDue Later");
let itemsDueLater = todos.dueLater();
let formattedItemsDueLater = todos.toDisplayableList(itemsDueLater);
console.log(formattedItemsDueLater);
console.log("\n");
