

function submitSignupClicked(event) {
  event.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const username = document.getElementById('signupUsername').value;
  const password = document.getElememtById('signupPassword').value;

  fetch('http://localhost:3001/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, username, password })
  })
  
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    console.log(data);
  })
  .catch(err => {
    console.error(err);
    alert("Error signing up");
  });
  }
// login
  function submitLoginCicked(event){
    event.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch ('http://localhost:3001/login',
      {
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({username,password})
      }
    )
     .then(res => res.json())
  .then(data => {
    alert(data.message);
    console.log(data);
  })
  .catch(err => {
    console.error(err);
    alert("Error signing in");
  });
  } 
