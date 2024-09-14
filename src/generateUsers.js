const fs = require('fs');

function generateUser(username, password, group) {
  return {
    username: username,
    enabled: true,
    credentials: [
      {
        type: 'password',
        value: password,
        temporary: false
      }
    ],
    groups: [group]
  };
}

function main() {
    console.log("Called main")
const users =[];

// Modify as needed
  const usersNames = [
   'user1','user2'
  ];
  console.log("users length ->", usersNames.length)
  for (let i = 0; i < usersNames.length; i++) {
    const username = usersNames[i];
    const password = `password@${i+1}`;// Modify as needed
    const group = 'group1'; // Modify as needed
    users.push(generateUser(username, password, group));
    console.log("Created User", i, username, password, group)
  }

  const realm = {
    realm: 'gd-ui',// Modify as needed
    users: users
  };

  fs.writeFile('users.json', JSON.stringify(realm, null, 2), (err) => {
    if (err) throw err;
    console.log('users.json has been saved!');
  });
}

main();
