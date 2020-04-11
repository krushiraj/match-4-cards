import React from 'react';

export default class CreateCard extends React.Component {
  render() {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center mr-4 mb-4">
          <input
            className="mx-auto shadow appearance-none border rounded w-auto py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="cardname"
            type="text"
            placeholder="Card Name"
            value={this.props.card}
            onChange={(e) => this.props.setCardName(e.target.value)}
          />

          <button
            className="flex align-middle bg-white-500 hover:bg-white-700 text-black font-bold border-2 py-1 px-4 mx-auto my-2 rounded"
            onClick={() => this.props.createCard()}
          >
            Create Card
          </button>
        </div>
      </div>
    );
  }
}
