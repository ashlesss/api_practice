const test = () => {
    let a = "葉月ゆう 大山チロル $circle:大山チロル$ $circle:大山チロル$"
    const result = a.match(/[^\s]+(?<=\$)(.*?)(?=\$)/g)
    console.log(result);
}

test()