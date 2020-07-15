import React, { Component } from "react";
import Header from "../components/Header";
import { auth } from "../services/firebase";
import { db } from "../services/firebase";
import slack from "slack"

export default class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: auth().currentUser,
      chats: [],
      content: '',
      readError: null,
      writeError: null,
      loadingChats: false,
      slackToken: null
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.myRef = React.createRef();
  }

  async componentDidMount() {
    this.loadSlack()
    this.setState({ readError: null, loadingChats: true });
    const chatArea = this.myRef.current;
    try {
      db.ref("chats").on("value", snapshot => {
        let chats = [];
        snapshot.forEach((snap) => {
          chats.push({ id: snap.key, ...snap.val()});
        });
        chats.sort(function (a, b) { return a.timestamp - b.timestamp })
        this.setState({ chats });
        chatArea.scrollBy(0, chatArea.scrollHeight);
        this.setState({ loadingChats: false });
      });
    } catch (error) {
      this.setState({ readError: error.message, loadingChats: false });
    }
  }

  async loadSlack () {
    try {
      const slackToken = await window.xkit.getConnectionToken("slack")
      if (slackToken) {
        this.setState({ slackToken })
      }
    } catch (e) {
      console.debug(`Error loading slack`, e)
    }
  }

  handleChange(event) {
    this.setState({
      content: event.target.value
    });
  }

  async handleShare(chat) {
    const { slackToken } = this.state
    if (!slackToken) {
      window.location.href = window.xkit.url
    }

    try {
      await db.ref(`chats/${chat.id}/status`).set('sharing')
      await slack.chat.postMessage({
        token: slackToken,
        text: `Someone in Chatty posted: "${chat.content}"`,
        channel: "C0101Q0HS3D"
      })
      await db.ref(`chats/${chat.id}/status`).set('shared')
    } catch (e) {
      this.setState({ writeError: e.message })
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.setState({ writeError: null });
    const chatArea = this.myRef.current;
    try {
      await db.ref("chats").push({
        content: this.state.content,
        timestamp: Date.now(),
        uid: this.state.user.uid
      });
      this.setState({ content: '' });
      chatArea.scrollBy(0, chatArea.scrollHeight);
    } catch (error) {
      this.setState({ writeError: error.message });
    }
  }

  formatTime(timestamp) {
    const d = new Date(timestamp);
    const time = `${d.getDate()}/${(d.getMonth()+1)}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
    return time;
  }

  renderSlackShare(chat) {
    if (!this.state.slackToken) {
      return <a href={window.xkit.connectorUrl("slack")} className="slack-share float-right">Connect to Slack</a>
    }

    if (chat.status === 'sharing') {
      return <span className="slack-share float-right">Sharing...</span>
    }

    if (chat.status === 'shared') {
      return <span className="slack-share float-right">Shared!</span>
    }

    return <a href="#share" className="slack-share float-right" onClick={() => this.handleShare(chat)}>Share to Slack</a>
  }

  render() {
    return (
      <div>
        <Header />

        <div className="chat-area" ref={this.myRef}>
          {/* loading indicator */}
          {this.state.loadingChats ? <div className="spinner-border text-success" role="status">
            <span className="sr-only">Loading...</span>
          </div> : ""}
          {/* chat area */}
          {this.state.chats.map(chat => {
            return <p key={chat.timestamp} className={"chat-bubble " + (this.state.user.uid === chat.uid ? "current-user" : "")}>
              {chat.content}
              <br />
              {this.renderSlackShare(chat)}
            </p>
          })}
        </div>
        <form onSubmit={this.handleSubmit} className="mx-3">
          <textarea className="form-control" name="content" onChange={this.handleChange} value={this.state.content}></textarea>
          {this.state.error ? <p className="text-danger">{this.state.error}</p> : null}
          <button type="submit" className="btn btn-submit px-5 mt-4">Send</button>
        </form>
      </div>
    );
  }
}
