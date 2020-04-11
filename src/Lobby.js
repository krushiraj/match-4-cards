import React from 'react';

export default class Lobby extends React.Component {
  render() {
    return (
      <div className="flex flex-col">
        <h1 className="mb-6 pt-6 mx-auto text-center">Would you like to</h1>
        <div className="mx-auto max-w-sm text-center flex flex-wrap justify-center">
          <div className="flex items-center mr-4 mb-4">
            <input
              id="joinRoomRadio"
              type="radio"
              name="joinroom"
              className="hidden"
              checked={this.props.joinRoom}
              onChange={() => this.props.setJoinRoom(true)}
            />
            <label
              htmlFor="joinRoomRadio"
              className="flex items-center cursor-pointer"
            >
              <span className="w-4 h-4 inline-block mr-1 rounded-full border border-grey"></span>
              Join Room
            </label>
          </div>

          <div className="flex items-center mr-4 mb-4">
            <input
              id="createRoomRadio"
              type="radio"
              name="createroom"
              className="hidden"
              checked={!this.props.joinRoom}
              onChange={() => this.props.setJoinRoom(false)}
            />
            <label
              htmlFor="createRoomRadio"
              className="flex items-center cursor-pointer"
            >
              <span className="w-4 h-4 inline-block mr-1 rounded-full border border-grey"></span>
              Create Room
            </label>
          </div>
        </div>
        <div className="flex flex-col items-center mr-4 mb-4">
          {this.props.joinRoom && (
            <input
              className="mx-auto shadow appearance-none border rounded w-auto py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="roomid"
              type="text"
              placeholder="Room ID"
              value={this.props.roomId}
              onChange={(e) => this.props.setRoomId(e.target.value)}
            />
          )}
          <button
            className="flex align-middle bg-white-500 hover:bg-white-700 text-black font-bold border-2 py-1 px-4 mx-auto my-2 rounded"
            onClick={() => this.props.joinOrCreateRoom()}
          >
            {this.props.joinRoom ? 'Join' : 'Create'} Room
          </button>
        </div>
      </div>
    );
  }
}
