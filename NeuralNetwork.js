"use strict";

var NeuralNetwork = function(data) {
  var inputs = data.inputs || 1;
  var hiddenLayers = data.hiddenLayers || 1;
  var layerNeurons = data.layerNeurons || 1;
  var outputs = data.outputs || 1;
  var weights = data.weights || [];
  let maxInitialWeight = data.maxInitialWeight || 0;

  if (weights.length === 0) {
    for (let layer = 0; layer < hiddenLayers+1; layer++) {
      weights.push([]); // 1st dimension - layer

      for (let neuron = 0; neuron < (layer === hiddenLayers ? outputs : layerNeurons); neuron++) {
        weights[layer].push([]); // 2nd dimension - layer:neuron
        for (let neuronFrom = 0; neuronFrom < (layer === 0 ? inputs : layerNeurons); neuronFrom++)
          weights[layer][neuron].push(maxInitialWeight*(2*Math.random() - 1)) // 3th dimension - layer:neuron:neuronFrom
      }
    }
  }

  this.mutate = function(maxStep) {
    for (let layer = 0; layer < weights.length; layer++) {
      for (let neuron = 0; neuron < weights[layer].length; neuron++) {
        for (let neuronFrom = 0; neuronFrom < weights[layer][neuron].length; neuronFrom++) {
          weights[layer][neuron][neuronFrom] += maxStep*(1 - 2*Math.random());
          // if (weights[layer][neuron][neuronFrom] > 1) weights[layer][neuron][neuronFrom] = 1;
          // if (weights[layer][neuron][neuronFrom] < 0) weights[layer][neuron][neuronFrom] = 0;
        }
      }
    }
  };

  this.getCopy = function() {
    var newWeights = [];
    // for (var layer = 0; layer < hiddenLayers+1; layer++) {
    //   newWeights.push(weights[layer]);
    //   for (var neuron = 0; neuron < (layer == hiddenLayers ? outputs : layerNeurons); neuron++) {
    //     newWeights[layer].push(weights[layer][neuron]);
    //     for (var neuronFrom = 0; neuronFrom < (layer == 0 ? inputs : layerNeurons); neuronFrom++)
    //       newWeights[layer][neuron].push(weights[layer][neuron][neuronFrom]);
    //   }
    // }

    for (var layer = 0; layer < weights.length; layer++) {
      newWeights.push([]);
      for (var neuron = 0; neuron < weights[layer].length; neuron++)
        newWeights[layer].push(weights[layer][neuron].slice(0));
    }

    return new NeuralNetwork({
      inputs: inputs,
      hiddenLayers: hiddenLayers,
      layerNeurons: layerNeurons,
      outputs: outputs,
      weights: newWeights
    });
  }

  this.getWeight = function(layer, neuron, neuronFrom) {
    return weights[layer][neuron][neuronFrom];
  }
  
  this.getResponse = function(input) {
    if (input.length != inputs)
      throw Error(`Input length doesn't match NN input: got ${input.length}, expected ${inputs}`);
    
    var prevSignals = input;
    for (var layer = 0; layer < hiddenLayers+1; layer++) {
      var resultSignal = [];
      for (var neuron = 0; neuron < (layer == hiddenLayers ? outputs : layerNeurons); neuron++) {
        var sum = 0;
        for (var neuronFrom = 0; neuronFrom < (layer == 0 ? inputs : prevSignals.length); neuronFrom++)
          sum += weights[layer][neuron][neuronFrom]*prevSignals[neuronFrom];
        resultSignal.push(activate(sum));
      }
      prevSignals = resultSignal;
    }
    return resultSignal;
  }

  this.getState = function() {
    return {
      inputs: inputs,
      hiddenLayers: hiddenLayers,
      layerNeurons: layerNeurons,
      outputs: outputs,
      weights: JSON.parse(JSON.stringify(weights))
    };
  }

  this.setState = function(state) {
    inputs = state.inputs;
    hiddenLayers = state.hiddenLayers;
    layerNeurons = state.layerNeurons;
    outputs = state.outputs;
    weights = JSON.parse(JSON.stringify(state.weights));
    return this;
  }

  var activate = function(value) {
    return Math.tanh(value);
  }
}