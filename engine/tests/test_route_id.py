from utils.route_id import create_route_id


def test():

    result = create_route_id(
        "Gunung Butak",
        "Panderman"
    )


    print(result)



if __name__ == "__main__":

    test()