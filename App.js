import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { init } from "@livechat/livechat-visitor-sdk";
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import NavBar, { NavButton, NavButtonText, NavTitle } from 'react-native-nav';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  navigation: {
    flex: 1,
  },
  systemMessage: {
    backgroundColor: '#fff',
    alignSelf: 'center', 
  },
  footerContainer: {
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#aaa',
  },
  status: {
    textAlign: 'center',
    padding: 5,
  }
});

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      messages: [],
      onlineStatus: false,
      typingText: null,
      users: {
        system: {
          name: 'system',
          _id: 'system',
        },
      },
    }
    this.visitorSDK = init({
      license: 9042815
    })
    this.visitorSDK.on('new_message', this.handleNewMessage.bind(this))
    this.visitorSDK.on('agent_changed', this.handleAgentChanged.bind(this))
    this.visitorSDK.on('status_changed', this.handleStateChange.bind(this))
    this.visitorSDK.on('typing_indicator', this.handleTypingIndicator.bind(this))
    this.visitorSDK.on('chat_ended', this.handleChatEnded.bind(this))
    this.visitorSDK.on('visitor_data', this.hendleVisitorData.bind(this))
    this.handleInputTextChange = this.handleInputTextChange.bind(this)
    this.handleSend = this.handleSend.bind(this)
    this.renderFooter = this.renderFooter.bind(this)
    this.getRenderInputToolbar = this.getRenderInputToolbar.bind(this)
  }

  renderFooter(props) {
    if (this.state.typingText) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            {this.state.typingText}
          </Text>
        </View>
      );
    }
    return null;
  }

  handleAgentChanged(newAgent) {
    this.addUser(newAgent, 'agent') 
  }

  hendleVisitorData(visitorData) {
    this.addUser(visitorData, 'visitor') 
  }

  addUser(newUser, type) {
    this.setState({
      users: Object.assign({}, this.state.users, {
        [newUser.id]: {
          _id: newUser.id,
          type: type,
          name: newUser.name || newUser.type,
          avatar: newUser.avatarUrl ? 'https://' + newUser.avatarUrl : null,
        }
      })  
    })
  }

  handleStateChange(statusData) {
    this.setState({
      onlineStatus: statusData.status === 'online',
    })
  }

  handleInputTextChange(text) {
    this.visitorSDK.setSneakPeek({ text: text })
  }

  handleChatEnded() {
    this.setState({
      messages: [{
        text: 'Chat is closed',
        _id: String(Math.random()),
        createdAt: Date.now(),
        user: {
          _id: 'system',
        },
      }, ...this.state.messages]
    })
  }

  handleTypingIndicator(typingData) {
    this.setState({
      typingText: typingData.isTyping ? 'Agent is typing...' : null,
    })
  }

  handleSend(messages) {
    this.visitorSDK.sendMessage({
      customId: String(Math.random()),
      text: messages[0].text,
    })
  }

  handleNewMessage(newMessage) {
    this.addMessage(newMessage)
  }

  addMessage(message) {
    this.setState({
      messages: [{
        text: message.text,
        _id: message.id,
        createdAt: message.timestamp,
        user: this.state.users[message.authorId],
      }, ...this.state.messages]
    })
  }

  getVisitor() {
    const visitorId = Object.keys(this.state.users).find((userId) => this.state.users[userId].type === 'visitor')
    return this.state.users[visitorId]
  }

  getRenderInputToolbar() {
    return this.state.onlineStatus ? null : () => null
  }

  render() {
    return (
      <View style={styles.container}>
        <NavBar style={StyleSheet.flatten(styles.navigation)}>
          <NavTitle style={StyleSheet.flatten(styles.navigation)}>
            {'Chat with us!'}
          </NavTitle>
        </NavBar>
        <View>
          <Text style={styles.status}>{ this.state.onlineStatus ? 'Welcome to our LiveChat! How may We help you?' : 'Our agents are not available right now.' }</Text>
        </View>
        <GiftedChat
            messages={this.state.messages}
            renderActions={this.renderCustomActions}
            renderFooter={this.renderFooter}
            renderInputToolbar={this.getRenderInputToolbar()}
            onSend={this.handleSend}
            onInputTextChanged={ this.handleInputTextChange }
            user={ this.getVisitor() }
          />
      </View>
    );
  }
}
