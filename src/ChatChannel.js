import React, {Component} from 'react';
import './Chat.css';
import MessageBubble from './MessageBubble';
import Dropzone from 'react-dropzone';
import styles from './ChatChannel.module.css';

class ChatChannel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newMessage: '',
      messages: [],
      loadingState: 'initializing',
      boundChannels: new Set(),
    };
  }

  loadMessagesFor = thisChannel => {
    if (this.props.channelProxy === thisChannel) {
      thisChannel
        .getMessages()
        .then(messagePaginator => {
          if (this.props.channelProxy === thisChannel) {
            this.setState({
              messages: messagePaginator.items,
              loadingState: 'ready',
            });
          }
        })
        .catch(err => {
          console.error("Couldn't fetch messages IMPLEMENT RETRY", err);
          this.setState({loadingState: 'failed'});
        });
    }
  };

  componentDidMount = () => {
    if (this.props.channelProxy) {
      this.loadMessagesFor(this.props.channelProxy);

      if (!this.state.boundChannels.has(this.props.channelProxy)) {
        let newChannel = this.props.channelProxy;
        newChannel.on('messageAdded', m => this.messageAdded(m, newChannel));
        this.setState({
          boundChannels: new Set([...this.state.boundChannels, newChannel]),
        });
      }
    }
  };

  componentDidUpdate = (oldProps, oldState) => {
    if (this.props.channelProxy !== oldState.channelProxy) {
      this.loadMessagesFor(this.props.channelProxy);

      if (!this.state.boundChannels.has(this.props.channelProxy)) {
        let newChannel = this.props.channelProxy;
        newChannel.on('messageAdded', m => this.messageAdded(m, newChannel));
        this.setState({
          boundChannels: new Set([...this.state.boundChannels, newChannel]),
        });
      }
    }
  };

  static getDerivedStateFromProps(newProps, oldState) {
    let logic =
      oldState.loadingState === 'initializing' ||
      oldState.channelProxy !== newProps.channelProxy;
    console.log('xxx', oldState.channelProxy, newProps.channelProxy, logic);
    if (logic) {
      return {
        loadingState: 'loading messages',
        channelProxy: newProps.channelProxy,
      };
    } else {
      return null;
    }
  }

  messageAdded = (message, targetChannel) => {
    if (targetChannel === this.props.channelProxy)
      this.setState((prevState, props) => ({
        messages: [...prevState.messages, message],
      }));
  };

  onMessageChanged = event => {
    this.setState({newMessage: event.target.value});
  };

  sendMessage = event => {
    event.preventDefault();
    const message = this.state.newMessage;
    this.setState({newMessage: ''});
    this.props.channelProxy.sendMessage(message);
  };

  onDrop = acceptedFiles => {
    console.log(acceptedFiles);
    this.props.channelProxy.sendMessage({
      contentType: acceptedFiles[0].type,
      media: acceptedFiles[0],
    });
  };

  render = () => {
    return (
      <div id="OpenChannel">
        <ul id="messages">
          {this.state.messages.map(m => {
            if (m.author === this.props.myIdentity)
              return (
                <MessageBubble key={m.index} direction="outgoing" message={m} />
              );
            else
              return (
                <MessageBubble key={m.index} direction="incoming" message={m} />
              );
          })}
        </ul>
        <form onSubmit={this.sendMessage}>
          <label htmlFor="message">Message: </label>
          <input
            type="text"
            name="message"
            id={styles['type-a-message']}
            autocomplete="off"
            disabled={this.state.loadingState !== 'ready'}
            onChange={this.onMessageChanged}
            value={this.state.newMessage}
          />
          <button>Send</button>
        </form>
        <Dropzone onDrop={this.onDrop} accept="image/*">
          {({getRootProps, getInputProps, isDragActive}) => (
            <div
              {...getRootProps()}
              className={`${styles.Dropzone} ${
                isDragActive ? styles.Highlight : ''
              }`}>
              <input id="files" {...getInputProps()} />
              <p>Drag Files Here</p>
            </div>
          )}
        </Dropzone>
      </div>
    );
  };
}

export default ChatChannel;
