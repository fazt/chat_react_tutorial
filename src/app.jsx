import React, { Component } from 'react';
import { render } from 'react-dom';

class ChatApp extends Component {
  constructor(props){
    super(props);
    this.state = {
      mensajes: [],
      socket: io(),
      usuario: undefined || "usuarioTemporal"
    };
    this.submitMessage = this.submitMessage.bind(this);
    this.pickUsername = this.pickUsername.bind(this);
  }

  componentDidMount() {
    this.refs.mensaje.disabled = true;
    this.refs.username.focus();

    var self = this;
    this.state.socket.on('mensajesDelServidor', (mensaje) => {
      var mensajes = this.state.mensajes;
      mensajes.push(mensaje);

      console.log(mensajes);

      this.setState({
        mensajes: mensajes
      });

    });
  }

  render() {

    let mensajes = this.state.mensajes.map((mensaje, i) => {
      return (
        <li key={i} className={mensaje.usuario === this.state.usuario ? "messageMe" : "messageHer"}>
          <img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" alt=""/>
          <span><strong style={{'paddingLeft': '7px'}}>{mensaje.usuario}</strong>: {mensaje.texto}</span>
          <div className="clearfix"></div>
        </li>);
    });

    return (
      <div className="container">
        <div className="row">
          <div className="panel panel-chat">
            <div className="panel-heading">
              <a><em>{this.state.usuario}</em></a>
              <a href="#" className="chatClose">
                <i className="glyphicon glyphicon-remove"></i>
              </a>
              <div className="clearfix"></div>
            </div>

            <ul className="panel-body">
              {mensajes}
            </ul>

            <form
              onSubmit={this.submitMessage}
              className="panel-footer">
              <input
                placeholder="Escribe Tu mensaje"
                ref="mensaje"
                type="text"/>
              <button
                type="submit" >
                <i className="fa fa-paper-plane" aria-hidden="true"></i>
              </button>

              <input ref="username" type="text" placeholder="Nombre de Usuario"/>
              <button type="button" onClick={()=> this.pickUsername()}>
                <i className="fa fa-user-circle" aria-hidden="true"></i>
              </button>

            </form>
          </div>
        </div>
      </div>
    )
  }

  submitMessage(event) {
    event.preventDefault();
    var textoMensaje = this.refs.mensaje.value;

    var mensaje = {
      texto: textoMensaje,
      usuario: this.state.usuario || "usuarioTemporal"
    }
    this.state.socket.emit('mensajesDelCliente', mensaje);

    this.refs.mensaje.value = '';
    this.refs.mensaje.focus();
  }

  pickUsername() {
    this.refs.mensaje.disabled = false;
    var usuario = this.refs.username.value;
    console.log(usuario);
    this.setState({
      usuario: usuario
    });
    this.refs.mensaje.focus();
  }
}

render(
  <ChatApp/>,
  document.getElementById('app')
)
