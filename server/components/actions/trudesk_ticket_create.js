var request = require("request");

function main(params) {
  const TRUDESK_SERVER = params["TRUEDESK_SERVER"];
  const convo_user = params["convo_user"];

  let paramIssue = params["new_issue"];
  let newIssue = {
    owner: paramIssue.owner,
    group: paramIssue.group,
    subject: paramIssue.subject,
    status: 0,
    tags: [],
    date: new Date().toISOString(),
    priority: "5c802aa9bbdfa43088680666",
    type: "5c802a4e38945132a83e9306",
    history: []
  };

  newIssue.issue = `
  <p>
    **Empresa:** ${params["new_issue"].business_name}
    **Contacto Empresa:** ${params["new_issue"].business_contact}
    **Productos y/o Servicios:** ${params["new_issue"].business_details}
    **Captura:** 
    ![](${params["new_issue"].screenshot})
  </p>
  `;

  return new Promise((resolve, reject) => {
    request.post(
      {
        json: true,
        url: `${TRUDESK_SERVER}/api/v1/tickets/create`,
        headers: {
          accesstoken: "899057397253bf930f1fa55b77f12623356d947f"
        },
        body: newIssue
      },
      function(err, response, body) {
        if (err) {
          console.log(err);
          reject(err);
        }
        if (body.error) {
          console.error(body.error);
          reject(new Error(body.error));
        }
        resolve(body);
      }
    );
  });
}

module.exports = main;
