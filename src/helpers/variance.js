// finds variance given arr and mean (since we have mean already, might as well use it)
// though, mean may not be accurate- seems that we might get a different result for
// clips of an audio since we don't cut it off between sentences.
const variance = (arr = [], mean) => {
  if (!arr.length || isNaN(mean)) {
    console.log("what on earth", arr, mean)
    return 0;
  }

  let variance = 0;
  arr.forEach(num => { variance += (num - mean) * (num - mean); });
  variance /= arr.length;
  return variance;
}

module.exports = variance;
